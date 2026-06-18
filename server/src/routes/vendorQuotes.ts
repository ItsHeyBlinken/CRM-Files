import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { Quote } from '../models/Quote'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

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
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, clientEmail, clientName, weddingDate, location, notes, currency, expiresInDays, lineItems } =
      req.body

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

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({ error: 'At least one line item is required' })
      return
    }

    for (const item of lineItems) {
      if (!item.description?.trim()) {
        res.status(400).json({ error: 'Each line item needs a description' })
        return
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({ error: 'Line item quantity must be greater than zero' })
        return
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        res.status(400).json({ error: 'Line item price cannot be negative' })
        return
      }
    }

    const quote = await Quote.create(Number(req.user.id), {
      title: title.trim(),
      clientEmail: clientEmail.trim(),
      clientName,
      weddingDate,
      location,
      notes,
      currency,
      expiresInDays,
      lineItems,
    })

    res.status(201).json({
      quote,
      quotePath: `/quote/${quote.token}`,
    })
  } catch (error) {
    logger.error('Create quote error:', error)
    if (error instanceof Error && error.message === 'LINE_ITEMS_REQUIRED') {
      res.status(400).json({ error: 'At least one line item is required' })
      return
    }
    res.status(500).json({ error: 'Failed to create quote' })
  }
})

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

// POST /api/vendor/quotes/:id/convert-to-project
router.post('/:id/convert-to-project', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteId = Number(req.params['id'])

    const result = await Quote.convertToProject(quoteId, Number(req.user.id))

    res.status(201).json({
      quote: result.quote,
      projectId: result.projectId,
    })
  } catch (error) {
    logger.error('Convert quote error:', error)

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
      }
    }

    res.status(500).json({ error: 'Failed to convert quote to project' })
  }
})

export default router
