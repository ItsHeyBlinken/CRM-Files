import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { Inquiry } from '../models/Inquiry'
import { Quote } from '../models/Quote'
import { logger } from '../utils/logger'
import { isPlanLimitError, sendPlanLimitError } from '../utils/planLimitHttp'

const router = Router()

router.use(protect, authorize('VENDOR'))

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/vendor/inquiries
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = Number(req.user.id)
    // Close any sent/draft quotes still linked to lost inquiries (incl. pre-fix orphans)
    await Quote.declineOpenLinkedToLostInquiries(vendorId)
    const inquiries = await Inquiry.findByVendorId(vendorId)
    res.json({ inquiries })
  } catch (error) {
    logger.error('List inquiries error:', error)
    res.status(500).json({ error: 'Failed to load inquiries' })
  }
})

// POST /api/vendor/inquiries
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, serviceType, eventDate, budget, notes, status } = req.body

    if (!name?.trim()) {
      res.status(400).json({ error: 'Name is required' })
      return
    }
    if (!email?.trim() || !emailRegex.test(email.trim())) {
      res.status(400).json({ error: 'A valid email is required' })
      return
    }

    if (status !== undefined && !Inquiry.isValidStatus(status)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }

    const budgetValue =
      budget === undefined || budget === null || budget === ''
        ? null
        : Number(budget)
    if (budgetValue !== null && (!Number.isFinite(budgetValue) || budgetValue < 0)) {
      res.status(400).json({ error: 'Budget must be a valid non-negative number' })
      return
    }

    const inquiry = await Inquiry.create(Number(req.user.id), {
      name: name.trim(),
      email: email.trim(),
      phone,
      serviceType,
      eventDate,
      budget: budgetValue,
      notes,
      status,
    })

    res.status(201).json({ inquiry })
  } catch (error) {
    logger.error('Create inquiry error:', error)
    res.status(500).json({ error: 'Failed to create inquiry' })
  }
})

// GET /api/vendor/inquiries/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inquiry = await Inquiry.findByIdForVendor(Number(req.params['id']), Number(req.user.id))
    if (!inquiry) {
      res.status(404).json({ error: 'Inquiry not found' })
      return
    }
    res.json({ inquiry })
  } catch (error) {
    logger.error('Get inquiry error:', error)
    res.status(500).json({ error: 'Failed to load inquiry' })
  }
})

// PUT /api/vendor/inquiries/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, serviceType, eventDate, budget, notes, status } = req.body

    if (email !== undefined && (!email?.trim() || !emailRegex.test(email.trim()))) {
      res.status(400).json({ error: 'A valid email is required' })
      return
    }
    if (status !== undefined && !Inquiry.isValidStatus(status)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }

    let budgetValue: number | null | undefined = undefined
    if (budget !== undefined) {
      if (budget === null || budget === '') {
        budgetValue = null
      } else {
        budgetValue = Number(budget)
        if (!Number.isFinite(budgetValue) || budgetValue < 0) {
          res.status(400).json({ error: 'Budget must be a valid non-negative number' })
          return
        }
      }
    }

    const inquiry = await Inquiry.update(Number(req.params['id']), Number(req.user.id), {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(serviceType !== undefined ? { serviceType } : {}),
      ...(eventDate !== undefined ? { eventDate } : {}),
      ...(budgetValue !== undefined ? { budget: budgetValue } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(status !== undefined ? { status } : {}),
    })

    if (!inquiry) {
      res.status(404).json({ error: 'Inquiry not found' })
      return
    }

    res.json({ inquiry })
  } catch (error) {
    logger.error('Update inquiry error:', error)
    if (error instanceof Error && error.message === 'INVALID_STATUS') {
      res.status(400).json({ error: 'Invalid status' })
      return
    }
    res.status(500).json({ error: 'Failed to update inquiry' })
  }
})

// POST /api/vendor/inquiries/:id/create-quote
router.post('/:id/create-quote', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, lineItems, packageId } = req.body
    const options: {
      title?: string
      lineItems?: Array<{ description: string; quantity: number; unitPrice: number }>
      packageId?: number
    } = {}
    if (title !== undefined) options.title = title
    if (lineItems !== undefined) options.lineItems = lineItems
    if (packageId !== undefined && packageId !== null && packageId !== '') {
      options.packageId = Number(packageId)
    }
    const result = await Inquiry.createQuoteFromInquiry(
      Number(req.params['id']),
      Number(req.user.id),
      options
    )

    res.status(201).json({
      inquiry: result.inquiry,
      quote: result.quote,
      quotePath: `/quote/${result.quote.token}`,
    })
  } catch (error) {
    logger.error('Create quote from inquiry error:', error)
    if (isPlanLimitError(error)) {
      sendPlanLimitError(res, error)
      return
    }
    if (error instanceof Error) {
      switch (error.message) {
        case 'INQUIRY_NOT_FOUND':
          res.status(404).json({ error: 'Inquiry not found' })
          return
        case 'PACKAGE_NOT_FOUND':
          res.status(404).json({ error: 'Quote package not found' })
          return
        case 'LINE_ITEMS_REQUIRED':
          res.status(400).json({ error: 'At least one line item is required' })
          return
      }
    }
    res.status(500).json({ error: 'Failed to create quote from inquiry' })
  }
})

export default router
