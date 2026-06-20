import { Router, Response, NextFunction } from 'express'
import path from 'path'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { contractPdfUpload, deliverableFileUpload } from '../middleware/projectUpload'
import { Project, ProjectStatus } from '../models/Project'
import { ProjectPaymentSettings } from '../models/ProjectPaymentSettings'
import { Contract } from '../models/Contract'
import { Deliverable } from '../models/Deliverable'
import { Invoice } from '../models/Invoice'
import {
  hasAnyClientPaymentMethod,
  VendorPaymentSettings,
} from '../models/VendorPaymentSettings'
import { logger } from '../utils/logger'

const router = Router()

const VALID_STATUSES: ProjectStatus[] = [
  'inquiry',
  'booked',
  'in_progress',
  'delivered',
  'complete',
  'cancelled',
]

router.use(protect, authorize('VENDOR'))

// GET /api/vendor/projects
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await Project.findByVendorId(Number(req.user.id))
    res.json({ projects })
  } catch (error) {
    logger.error('List projects error:', error)
    res.status(500).json({ error: 'Failed to load projects' })
  }
})

// POST /api/vendor/projects
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, eventDate, location, status, clientDisplayName, clientEmail, internalNotes } =
      req.body

    if (!title?.trim()) {
      res.status(400).json({ error: 'Project title is required' })
      return
    }

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid project status' })
      return
    }

    const project = await Project.create(Number(req.user.id), {
      title: title.trim(),
      description,
      eventDate,
      location,
      status,
      clientDisplayName,
      clientEmail,
      internalNotes,
    })

    res.status(201).json({ project })
  } catch (error) {
    logger.error('Create project error:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// GET /api/vendor/projects/:id/contracts
router.get('/:id/contracts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params['id'])
    const contracts = await Contract.findByProjectForVendor(projectId, Number(req.user.id))
    res.json({ contracts })
  } catch (error) {
    logger.error('List contracts error:', error)
    res.status(500).json({ error: 'Failed to load contracts' })
  }
})

// POST /api/vendor/projects/:id/contracts
router.post(
  '/:id/contracts',
  (req: AuthRequest, res: Response, next: NextFunction) => {
    contractPdfUpload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'File upload failed'
        res.status(400).json({ error: message })
        return
      }
      next()
    })
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectId = Number(req.params['id'])
      const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''

      if (!title) {
        res.status(400).json({ error: 'Contract title is required' })
        return
      }

      if (!req.file) {
        res.status(400).json({ error: 'PDF file is required' })
        return
      }

      const relativeFilePath = path.join('contracts', String(projectId), req.file.filename)

      const contract = await Contract.create(projectId, Number(req.user.id), {
        title,
        relativeFilePath: relativeFilePath.replace(/\\/g, '/'),
        fileName: req.file.originalname,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
      })

      res.status(201).json({ contract })
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      if (error instanceof Error && error.message === 'CONTRACT_ALREADY_EXISTS') {
        res.status(409).json({
          error: 'This project already has a contract. MVP supports one contract per project.',
        })
        return
      }
      logger.error('Upload contract error:', error)
      res.status(500).json({ error: 'Failed to upload contract' })
    }
  }
)

// GET /api/vendor/projects/:id/deliverables
router.get('/:id/deliverables', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params['id'])
    const deliverables = await Deliverable.findByProjectForVendor(
      projectId,
      Number(req.user.id)
    )
    res.json({ deliverables })
  } catch (error) {
    logger.error('List deliverables error:', error)
    res.status(500).json({ error: 'Failed to load deliverables' })
  }
})

// POST /api/vendor/projects/:id/deliverables
router.post(
  '/:id/deliverables',
  (req: AuthRequest, res: Response, next: NextFunction) => {
    deliverableFileUpload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'File upload failed'
        res.status(400).json({ error: message })
        return
      }
      next()
    })
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectId = Number(req.params['id'])
      const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
      const description =
        typeof req.body.description === 'string' ? req.body.description.trim() : null

      if (!title) {
        res.status(400).json({ error: 'Deliverable title is required' })
        return
      }

      if (!req.file) {
        res.status(400).json({ error: 'File is required' })
        return
      }

      const relativeFilePath = path
        .join('deliverables', String(projectId), req.file.filename)
        .replace(/\\/g, '/')

      const deliverable = await Deliverable.create(projectId, Number(req.user.id), {
        title,
        description,
        relativeFilePath,
        fileName: req.file.originalname,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype || null,
      })

      res.status(201).json({ deliverable })
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      logger.error('Upload deliverable error:', error)
      res.status(500).json({ error: 'Failed to upload deliverable' })
    }
  }
)

// GET /api/vendor/projects/:id/invoices
router.get('/:id/invoices', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params['id'])
    const invoices = await Invoice.findByProjectForVendor(projectId, Number(req.user.id))
    res.json({ invoices })
  } catch (error) {
    logger.error('List invoices error:', error)
    res.status(500).json({ error: 'Failed to load invoices' })
  }
})

// POST /api/vendor/projects/:id/invoices
router.post('/:id/invoices', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params['id'])
    const {
      title,
      invoiceNumber,
      description,
      amount,
      currency,
      dueDate,
      notes,
      status,
      invoiceKind,
      isDateHoldingDeposit,
    } =
      req.body

    const invoice = await Invoice.create(projectId, Number(req.user.id), {
      title,
      invoiceNumber,
      description,
      amount: Number(amount),
      currency,
      dueDate,
      notes,
      status,
      invoiceKind,
      isDateHoldingDeposit: Boolean(isDateHoldingDeposit),
    })

    res.status(201).json({ invoice })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    if (error instanceof Error && error.message === 'TITLE_REQUIRED') {
      res.status(400).json({ error: 'Invoice title is required' })
      return
    }
    if (error instanceof Error && error.message === 'INVALID_AMOUNT') {
      res.status(400).json({ error: 'Amount must be zero or greater' })
      return
    }
    logger.error('Create invoice error:', error)
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

// GET /api/vendor/projects/:id/payment-settings
router.get('/:id/payment-settings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params['id'])
    const settings = await ProjectPaymentSettings.findByProjectForVendor(
      projectId,
      Number(req.user.id)
    )

    if (!settings) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.json({ settings })
  } catch (error) {
    logger.error('Get project payment settings error:', error)
    res.status(500).json({ error: 'Failed to load project payment settings' })
  }
})

// PUT /api/vendor/projects/:id/payment-settings
router.put('/:id/payment-settings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params['id'])
    const {
      projectTotal,
      paymentPlanType,
      depositType,
      depositValue,
      secondPaymentDueDaysBeforeEvent,
      finalPaymentDueDaysBeforeEvent,
    } = req.body

    if (
      paymentPlanType !== 'pay_in_full' &&
      paymentPlanType !== 'deposit_and_balance' &&
      paymentPlanType !== 'split_payments'
    ) {
      res.status(400).json({ error: 'Invalid payment plan type' })
      return
    }

    const settings = await ProjectPaymentSettings.upsertForVendor(projectId, Number(req.user.id), {
      projectTotal: projectTotal == null || projectTotal === '' ? null : Number(projectTotal),
      paymentPlanType,
      depositType:
        depositType === 'fixed' || depositType === 'percentage' ? depositType : null,
      depositValue: depositValue == null || depositValue === '' ? null : Number(depositValue),
      secondPaymentDueDaysBeforeEvent:
        secondPaymentDueDaysBeforeEvent == null || secondPaymentDueDaysBeforeEvent === ''
          ? null
          : Number(secondPaymentDueDaysBeforeEvent),
      finalPaymentDueDaysBeforeEvent:
        finalPaymentDueDaysBeforeEvent == null || finalPaymentDueDaysBeforeEvent === ''
          ? null
          : Number(finalPaymentDueDaysBeforeEvent),
    })

    if (!settings) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.json({ settings })
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message === 'INVALID_DEPOSIT_VALUE' || error.message === 'INVALID_PROJECT_TOTAL')
    ) {
      res.status(400).json({ error: 'Payment amounts must be zero or greater' })
      return
    }
    logger.error('Update project payment settings error:', error)
    res.status(500).json({ error: 'Failed to update project payment settings' })
  }
})

// PUT /api/vendor/projects/:id/invoices/:invoiceId
router.put('/:id/invoices/:invoiceId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params['id'])
    const invoiceId = Number(req.params['invoiceId'])

    const invoice = await Invoice.update(invoiceId, projectId, Number(req.user.id), req.body)

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }

    res.json({ invoice })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'INVOICE_ALREADY_PAID') {
      res.status(409).json({ error: 'Paid invoices cannot be edited' })
      return
    }
    if (error instanceof Error && error.message === 'INVALID_AMOUNT') {
      res.status(400).json({ error: 'Amount must be zero or greater' })
      return
    }
    logger.error('Update invoice error:', error)
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

// DELETE /api/vendor/projects/:id/invoices/:invoiceId
router.delete(
  '/:id/invoices/:invoiceId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectId = Number(req.params['id'])
      const invoiceId = Number(req.params['invoiceId'])

      const deleted = await Invoice.delete(invoiceId, projectId, Number(req.user.id))

      if (!deleted) {
        res.status(404).json({ error: 'Invoice not found' })
        return
      }

      res.json({ message: 'Invoice deleted' })
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'INVOICE_ALREADY_PAID') {
        res.status(409).json({ error: 'Paid invoices cannot be deleted' })
        return
      }
      logger.error('Delete invoice error:', error)
      res.status(500).json({ error: 'Failed to delete invoice' })
    }
  }
)

// POST /api/vendor/projects/:id/invoices/:invoiceId/send
router.post(
  '/:id/invoices/:invoiceId/send',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectId = Number(req.params['id'])
      const invoiceId = Number(req.params['invoiceId'])

      const paymentSettings = await VendorPaymentSettings.findByVendorId(Number(req.user.id))
      if (!hasAnyClientPaymentMethod(paymentSettings)) {
        res.status(409).json({
          error:
            'Set up how clients pay you before sending an invoice. Go to Payments in your dashboard.',
        })
        return
      }

      const invoice = await Invoice.sendToClient(invoiceId, projectId, Number(req.user.id))

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' })
        return
      }

      res.json({ invoice })
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'INVALID_STATUS_TRANSITION') {
        res.status(409).json({ error: 'This invoice cannot be sent to the client' })
        return
      }
      logger.error('Send invoice error:', error)
      res.status(500).json({ error: 'Failed to send invoice' })
    }
  }
)

// POST /api/vendor/projects/:id/invoices/:invoiceId/mark-paid
router.post(
  '/:id/invoices/:invoiceId/mark-paid',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectId = Number(req.params['id'])
      const invoiceId = Number(req.params['invoiceId'])
      const paymentMethod =
        typeof req.body.paymentMethod === 'string' ? req.body.paymentMethod : 'manual'

      const invoice = await Invoice.markPaid(
        invoiceId,
        projectId,
        Number(req.user.id),
        paymentMethod as 'manual' | 'venmo' | 'zelle' | 'cashapp' | 'paypal'
      )

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' })
        return
      }

      res.json({ invoice })
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'INVALID_STATUS_TRANSITION') {
        res.status(409).json({ error: 'This invoice cannot be marked as paid' })
        return
      }
      logger.error('Mark invoice paid error:', error)
      res.status(500).json({ error: 'Failed to mark invoice as paid' })
    }
  }
)

// GET /api/vendor/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const detail = await Project.findDetailForVendor(
      Number(req.params['id']),
      Number(req.user.id)
    )

    if (!detail) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.json({ detail })
  } catch (error) {
    logger.error('Get project error:', error)
    res.status(500).json({ error: 'Failed to load project' })
  }
})

// PUT /api/vendor/projects/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid project status' })
      return
    }

    const project = await Project.update(
      Number(req.params['id']),
      Number(req.user.id),
      req.body
    )

    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.json({ project })
  } catch (error) {
    logger.error('Update project error:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// DELETE /api/vendor/projects/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await Project.delete(Number(req.params['id']), Number(req.user.id))

    if (!deleted) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.json({ message: 'Project deleted' })
  } catch (error) {
    logger.error('Delete project error:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// POST /api/vendor/projects/:id/invite
router.post('/:id/invite', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, expiresInDays } = req.body

    if (!email?.trim()) {
      res.status(400).json({ error: 'Client email is required' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    const invite = await Project.createInvite(
      Number(req.params['id']),
      Number(req.user.id),
      email,
      expiresInDays ?? 14
    )

    res.status(201).json({
      invite: {
        ...invite,
        invitePath: `/invite/${invite.token}`,
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    if (error instanceof Error && error.message === 'PROJECT_ALREADY_HAS_CLIENT') {
      res.status(409).json({
        error:
          'This project already has a client on the portal. MVP supports one client per project — create a new project to invite someone else.',
      })
      return
    }
    logger.error('Create invite error:', error)
    res.status(500).json({ error: 'Failed to create invite' })
  }
})

export default router
