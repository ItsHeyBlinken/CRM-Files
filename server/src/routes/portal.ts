import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { Project } from '../models/Project'
import { Contract } from '../models/Contract'
import { Invoice } from '../models/Invoice'
import { notifyInvoicePaymentClaimed } from '../services/notificationService'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('CLIENT'))

// GET /api/portal/project
router.get('/project', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const portalProject = await Project.findClientProject(Number(req.user.id))

    if (!portalProject) {
      res.status(404).json({
        error: 'No project linked to your account yet. Ask your vendor to send an invite.',
      })
      return
    }

    res.json(portalProject)
  } catch (error) {
    logger.error('Portal project error:', error)
    res.status(500).json({ error: 'Failed to load your project' })
  }
})

// GET /api/portal/contracts/:id/signing-context
router.get('/contracts/:id/signing-context', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const context = await Contract.getSigningContext(
      Number(req.params['id']),
      Number(req.user.id)
    )

    if (!context) {
      res.status(404).json({ error: 'Contract not found' })
      return
    }

    res.json({ context })
  } catch (error) {
    if (error instanceof Error && error.message === 'CONTRACT_FILE_MISSING') {
      res.status(404).json({
        error: 'Contract file not found on server. Ask your vendor to re-upload the PDF.',
      })
      return
    }
    logger.error('Contract signing context error:', error)
    res.status(500).json({ error: 'Failed to load contract signing details' })
  }
})

// GET /api/portal/contracts/:id/file
router.get('/contracts/:id/file', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findByIdForClient(
      Number(req.params['id']),
      Number(req.user.id)
    )

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' })
      return
    }

    if (!Contract.fileExists(contract.filePath)) {
      logger.error('Portal contract file missing on disk:', {
        contractId: contract.id,
        filePath: contract.filePath,
      })
      res.status(404).json({
        error: 'Contract file not found on server. Ask your vendor to re-upload the PDF.',
      })
      return
    }

    const absolutePath = Contract.getAbsolutePath(contract.filePath)
    res.setHeader('Content-Type', contract.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${contract.fileName}"`)
    res.sendFile(absolutePath, (err) => {
      if (err) {
        logger.error('Contract file send error:', err)
        if (!res.headersSent) {
          res.status(404).json({ error: 'Contract file not found on server' })
        }
      }
    })
  } catch (error) {
    logger.error('Contract file error:', error)
    res.status(500).json({ error: 'Failed to load contract' })
  }
})

// POST /api/portal/contracts/:id/acknowledge
router.post('/contracts/:id/acknowledge', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      legalName,
      pdfHash,
      viewDurationSeconds,
      scrolledToEnd,
      consentAccepted,
      confirmLegalName,
    } = req.body

    if (!legalName || !pdfHash || typeof consentAccepted !== 'boolean') {
      res.status(400).json({ error: 'Legal name, document hash, and consent are required' })
      return
    }

    const forwarded = req.headers['x-forwarded-for']
    const acknowledgementIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim() ?? null
        : req.ip ?? null

    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null

    const contract = await Contract.acknowledge(
      Number(req.params['id']),
      Number(req.user.id),
      acknowledgementIp,
      userAgent,
      {
        legalName: String(legalName),
        pdfHash: String(pdfHash),
        viewDurationSeconds: Number(viewDurationSeconds) || 0,
        scrolledToEnd: Boolean(scrolledToEnd),
        consentAccepted,
        confirmLegalName: Boolean(confirmLegalName),
      }
    )

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' })
      return
    }

    res.json({ contract })
  } catch (error) {
    logger.error('Contract acknowledge error:', error)

    if (error instanceof Error) {
      switch (error.message) {
        case 'LEGAL_NAME_REQUIRED':
          res.status(400).json({ error: 'Please enter your full legal name' })
          return
        case 'CONSENT_REQUIRED':
          res.status(400).json({ error: 'You must agree to the electronic signature statement' })
          return
        case 'PDF_HASH_MISMATCH':
          res.status(409).json({
            error: 'This contract was updated. Please review the document again before signing.',
          })
          return
        case 'REVIEW_INCOMPLETE':
          res.status(400).json({
            error: 'Please review the full contract (scroll to the end or read for at least 15 seconds)',
          })
          return
        case 'CONTRACT_FILE_MISSING':
          res.status(404).json({
            error: 'Contract file not found on server. Ask your vendor to re-upload the PDF.',
          })
          return
        case 'LEGAL_NAME_CONFIRMATION_REQUIRED':
          res.status(400).json({
            error: 'Please confirm that the name you entered is your full legal name',
          })
          return
      }
    }

    res.status(500).json({ error: 'Failed to sign contract' })
  }
})

// POST /api/portal/invoices/:id/claim-sent
router.post('/invoices/:id/claim-sent', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = typeof req.body.note === 'string' ? req.body.note : null

    const invoice = await Invoice.claimClientPayment(
      Number(req.params['id']),
      Number(req.user.id),
      note
    )

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }

    const project = await Project.findById(invoice.projectId)
    if (project) {
      await notifyInvoicePaymentClaimed({
        vendorId: project.vendorId,
        projectId: project.id,
        invoiceTitle: invoice.title,
      })
    }

    res.json({ invoice })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'INVALID_STATUS_TRANSITION') {
      res.status(409).json({ error: 'This invoice cannot accept a payment claim' })
      return
    }
    logger.error('Claim payment error:', error)
    res.status(500).json({ error: 'Failed to record payment' })
  }
})

export default router
