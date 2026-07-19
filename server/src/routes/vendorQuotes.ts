import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { quoteContractPdfUpload } from '../middleware/quoteUpload'
import { Quote } from '../models/Quote'
import { QuoteContract } from '../models/QuoteContract'
import { Inquiry } from '../models/Inquiry'
import { VendorProfile } from '../models/VendorProfile'
import { getPublicAppUrl, sendQuoteEmail } from '../services/emailService'
import { logger } from '../utils/logger'
import { isPlanLimitError, sendPlanLimitError } from '../utils/planLimitHttp'

const router = Router()

router.use(protect, authorize('VENDOR'))

function parseLineItems(raw: unknown): Array<{ description: string; quantity: number; unitPrice: number }> {
  if (typeof raw === 'string') {
    return JSON.parse(raw) as Array<{ description: string; quantity: number; unitPrice: number }>
  }
  return raw as Array<{ description: string; quantity: number; unitPrice: number }>
}

function validateLineItems(
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
): string | null {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return 'At least one line item is required'
  }
  for (const item of lineItems) {
    if (!item.description?.trim()) {
      return 'Each line item needs a description'
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      return 'Line item quantity must be greater than zero'
    }
    if (typeof item.unitPrice !== 'number' || !Number.isFinite(item.unitPrice)) {
      return 'Line item price must be a valid number'
    }
  }
  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  if (total < 0) {
    return 'Quote total cannot be negative'
  }
  return null
}

function parseOptionalNumber(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined
  }
  const value = typeof raw === 'string' ? Number(raw) : Number(raw)
  return Number.isFinite(value) ? value : undefined
}

// GET /api/vendor/quotes
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quotes = await Quote.findByVendorId(Number(req.user.id))
    res.json({ quotes })
  } catch (error) {
    logger.error('List quotes error:', error)
    res.status(500).json({ error: 'Failed to load quotes' })
  }
})

// POST /api/vendor/quotes
router.post(
  '/',
  (req, res, next) => {
    quoteContractPdfUpload.single('contractFile')(req, res, (err: unknown) => {
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
      const {
        title,
        clientEmail,
        clientName,
        eventDate,
        location,
        notes,
        currency,
        expiresInDays,
        lineItems: lineItemsRaw,
        contractTitle,
        attachContract,
      } = req.body

      if (!title?.trim()) {
        res.status(400).json({ error: 'Quote title is required' })
        return
      }

      if (!clientEmail?.trim()) {
        res.status(400).json({ error: 'Client email is required' })
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(clientEmail.trim())) {
        res.status(400).json({ error: 'Invalid client email format' })
        return
      }

      let lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
      try {
        lineItems = parseLineItems(lineItemsRaw)
      } catch {
        res.status(400).json({ error: 'Invalid line items format' })
        return
      }

      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        res.status(400).json({ error: 'At least one line item is required' })
        return
      }

      const lineItemError = validateLineItems(lineItems)
      if (lineItemError) {
        res.status(400).json({ error: lineItemError })
        return
      }

      const wantsContract =
        attachContract === true ||
        attachContract === 'true' ||
        attachContract === 'on' ||
        !!req.file

      if (wantsContract && !req.file) {
        res.status(400).json({ error: 'Choose a PDF contract file to attach, or turn off contract attachment' })
        return
      }

      if (req.file && !contractTitle?.trim()) {
        res.status(400).json({ error: 'Contract title is required when attaching a contract' })
        return
      }

      const parsedExpiresInDays = parseOptionalNumber(expiresInDays)

      let quote: Awaited<ReturnType<typeof Quote.create>> | undefined

      try {
        quote = await Quote.create(Number(req.user.id), {
          title: title.trim(),
          clientEmail: clientEmail.trim(),
          clientName,
          eventDate,
          location,
          notes,
          currency,
          ...(parsedExpiresInDays !== undefined ? { expiresInDays: parsedExpiresInDays } : {}),
          lineItems,
        })

        if (req.file) {
          await QuoteContract.attach(quote.id, Number(req.user.id), {
            title: contractTitle.trim(),
            buffer: req.file.buffer,
            originalFileName: req.file.originalname,
            fileSizeBytes: req.file.size,
            mimeType: req.file.mimetype,
          })
        }
      } catch (attachError) {
        if (quote?.id) {
          await Quote.deleteForVendor(quote.id, Number(req.user.id))
        }
        throw attachError
      }

      const fullQuote = await Quote.findByIdForVendor(quote.id, Number(req.user.id))

      res.status(201).json({
        quote: fullQuote ?? quote,
        quotePath: `/quote/${quote.token}`,
      })
    } catch (error) {
      logger.error('Create quote error:', error)
      if (isPlanLimitError(error)) {
        sendPlanLimitError(res, error)
        return
      }
      if (error instanceof Error && error.message === 'LINE_ITEMS_REQUIRED') {
        res.status(400).json({ error: 'At least one line item is required' })
        return
      }
      if (error instanceof Error && error.message === 'QUOTE_CONTRACT_ALREADY_EXISTS') {
        res.status(409).json({ error: 'This quote already has a contract attached' })
        return
      }
      if (error instanceof Error && error.message === 'QUOTE_NOT_FOUND') {
        res.status(404).json({ error: 'Quote not found' })
        return
      }
      res.status(500).json({ error: 'Failed to create quote' })
    }
  }
)

// GET /api/vendor/quotes/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = Number(req.params['id'])
    const quote = await Quote.findByIdForVendor(quoteId, Number(req.user.id))

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' })
      return
    }

    res.json({
      quote,
      quotePath: `/quote/${quote.token}`,
    })
  } catch (error) {
    logger.error('Get quote error:', error)
    res.status(500).json({ error: 'Failed to load quote' })
  }
})

// PUT /api/vendor/quotes/:id — edit draft/sent quotes (line items, discount, details)
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = Number(req.params['id'])
    const vendorId = Number(req.user.id)
    const {
      title,
      clientEmail,
      clientName,
      eventDate,
      location,
      notes,
      lineItems: lineItemsRaw,
    } = req.body

    if (clientEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!clientEmail?.trim() || !emailRegex.test(clientEmail.trim())) {
        res.status(400).json({ error: 'Invalid client email format' })
        return
      }
    }

    let lineItems: Array<{ description: string; quantity: number; unitPrice: number }> | undefined
    if (lineItemsRaw !== undefined) {
      try {
        lineItems = parseLineItems(lineItemsRaw)
      } catch {
        res.status(400).json({ error: 'Invalid line items format' })
        return
      }
      const lineItemError = validateLineItems(lineItems)
      if (lineItemError) {
        res.status(400).json({ error: lineItemError })
        return
      }
    }

    const updatePayload: {
      title?: string
      clientEmail?: string
      clientName?: string | null
      eventDate?: string | null
      location?: string | null
      notes?: string | null
      lineItems?: Array<{ description: string; quantity: number; unitPrice: number }>
    } = {}
    if (title !== undefined) updatePayload.title = title
    if (clientEmail !== undefined) updatePayload.clientEmail = clientEmail
    if (clientName !== undefined) updatePayload.clientName = clientName
    if (eventDate !== undefined) updatePayload.eventDate = eventDate
    if (location !== undefined) updatePayload.location = location
    if (notes !== undefined) updatePayload.notes = notes
    if (lineItems !== undefined) updatePayload.lineItems = lineItems

    const quote = await Quote.update(quoteId, vendorId, updatePayload)
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' })
      return
    }

    res.json({
      quote,
      quotePath: `/quote/${quote.token}`,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'QUOTE_NOT_EDITABLE') {
        res.status(400).json({
          error: 'This quote can no longer be edited. Create a new quote if you need changes.',
        })
        return
      }
      if (error.message === 'LINE_ITEMS_REQUIRED') {
        res.status(400).json({ error: 'At least one line item is required' })
        return
      }
      if (error.message === 'QUOTE_TOTAL_NEGATIVE') {
        res.status(400).json({ error: 'Quote total cannot be negative' })
        return
      }
    }
    logger.error('Update quote error:', error)
    res.status(500).json({ error: 'Failed to update quote' })
  }
})

// GET /api/vendor/quotes/:id/contract
router.get('/:id/contract', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = Number(req.params['id'])
    const contract = await QuoteContract.findByQuoteIdForVendor(quoteId, Number(req.user.id))

    if (!contract) {
      res.status(404).json({ error: 'No contract attached to this quote' })
      return
    }

    const absolutePath = QuoteContract.getAbsolutePath(contract.filePath)
    if (!QuoteContract.fileExists(contract.filePath)) {
      logger.error('Vendor quote contract file missing on disk:', {
        quoteId,
        filePath: contract.filePath,
        absolutePath,
      })
      res.status(404).json({ error: 'Contract file not found on server' })
      return
    }

    res.setHeader('Content-Type', contract.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${contract.fileName}"`)
    res.sendFile(absolutePath, (err) => {
      if (err) {
        logger.error('Quote contract file send error:', err)
        if (!res.headersSent) {
          res.status(404).json({ error: 'Contract file not found on server' })
        }
      }
    })
  } catch (error) {
    logger.error('Vendor quote contract file error:', error)
    res.status(500).json({ error: 'Failed to load contract' })
  }
})

// POST /api/vendor/quotes/:id/contract — attach or replace contract PDF on existing quote
router.post(
  '/:id/contract',
  (req, res, next) => {
    quoteContractPdfUpload.single('contractFile')(req, res, (err: unknown) => {
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
      const quoteId = Number(req.params['id'])
      const vendorId = Number(req.user.id)
      const { contractTitle } = req.body

      if (!req.file) {
        res.status(400).json({ error: 'Choose a PDF contract file to upload' })
        return
      }

      if (!contractTitle?.trim()) {
        res.status(400).json({ error: 'Contract title is required' })
        return
      }

      await QuoteContract.replaceOrAttach(quoteId, vendorId, {
        title: contractTitle.trim(),
        buffer: req.file.buffer,
        originalFileName: req.file.originalname,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
      })

      const quote = await Quote.findByIdForVendor(quoteId, vendorId)
      if (!quote) {
        res.status(404).json({ error: 'Quote not found' })
        return
      }

      res.json({ quote })
    } catch (error) {
      logger.error('Upload quote contract error:', error)
      if (error instanceof Error) {
        switch (error.message) {
          case 'QUOTE_NOT_FOUND':
            res.status(404).json({ error: 'Quote not found' })
            return
          case 'QUOTE_CONTRACT_UPLOAD_NOT_ALLOWED':
            res.status(400).json({ error: 'Cannot change the contract on this quote' })
            return
          case 'QUOTE_CONTRACT_ALREADY_SIGNED':
            res.status(409).json({
              error: 'Client already signed this contract — create a new quote to send an updated agreement',
            })
            return
        }
      }
      res.status(500).json({ error: 'Failed to upload contract' })
    }
  }
)

// POST /api/vendor/quotes/:id/convert-to-project
router.post('/:id/convert-to-project', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = Number(req.params['id'])

    const result = await Quote.convertToProject(quoteId, Number(req.user.id))
    await Inquiry.markBookedByQuoteId(quoteId, Number(req.user.id))

    res.status(201).json({
      quote: result.quote,
      projectId: result.projectId,
    })
  } catch (error) {
    logger.error('Convert quote error:', error)

    if (isPlanLimitError(error)) {
      sendPlanLimitError(res, error)
      return
    }

    if (error instanceof Error) {
      switch (error.message) {
        case 'QUOTE_NOT_FOUND':
          res.status(404).json({ error: 'Quote not found' })
          return
        case 'QUOTE_NOT_ACCEPTED':
          res.status(400).json({ error: 'Quote must be accepted before converting to a project' })
          return
        case 'QUOTE_ALREADY_CONVERTED':
          res.status(409).json({ error: 'This quote has already been converted to a project' })
          return
        case 'QUOTE_CONTRACT_FILE_MISSING':
          res.status(500).json({ error: 'Attached contract file is missing. Re-upload the contract and try again.' })
          return
      }
    }

    res.status(500).json({ error: 'Failed to convert quote to project' })
  }
})

// POST /api/vendor/quotes/:id/send-email
router.post('/:id/send-email', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = Number(req.params['id'])
    const vendorId = Number(req.user.id)
    const quote = await Quote.findByIdForVendor(quoteId, vendorId)

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' })
      return
    }

    const profile = await VendorProfile.findByUserId(vendorId)
    const quotePath = `/quote/${quote.token}`
    const emailResult = await sendQuoteEmail({
      to: quote.clientEmail,
      clientName: quote.clientName,
      vendorBusinessName: profile?.businessName ?? 'Your vendor',
      quoteTitle: quote.title,
      quoteUrl: getPublicAppUrl(quotePath),
      totalLabel: new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: quote.currency,
      }).format(quote.totalAmount),
      hasContract: Boolean(quote.contract),
    })

    res.json({ email: emailResult, quotePath })
  } catch (error) {
    logger.error('Send quote email error:', error)
    res.status(500).json({ error: 'Failed to send quote email' })
  }
})

export default router
