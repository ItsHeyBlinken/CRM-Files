import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { QuotePackage } from '../models/QuotePackage'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

function parseLineItems(
  raw: unknown
): Array<{ description: string; quantity: number; unitPrice: number }> {
  if (!Array.isArray(raw)) {
    throw new Error('INVALID_LINE_ITEMS')
  }
  return raw as Array<{ description: string; quantity: number; unitPrice: number }>
}

// GET /api/vendor/quote-packages
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const packages = await QuotePackage.findByVendorId(Number(req.user.id))
    res.json({ packages })
  } catch (error) {
    logger.error('List quote packages error:', error)
    res.status(500).json({ error: 'Failed to load quote packages' })
  }
})

// POST /api/vendor/quote-packages
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, lineItems: lineItemsRaw } = req.body
    let lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
    try {
      lineItems = parseLineItems(lineItemsRaw)
    } catch {
      res.status(400).json({ error: 'Invalid line items' })
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

    const pkg = await QuotePackage.create(Number(req.user.id), {
      name,
      description,
      lineItems,
    })
    res.status(201).json({ package: pkg })
  } catch (error) {
    logger.error('Create quote package error:', error)
    if (error instanceof Error && error.message === 'NAME_REQUIRED') {
      res.status(400).json({ error: 'Package name is required' })
      return
    }
    if (error instanceof Error && error.message === 'LINE_ITEMS_REQUIRED') {
      res.status(400).json({ error: 'At least one line item is required' })
      return
    }
    res.status(500).json({ error: 'Failed to create quote package' })
  }
})

// PUT /api/vendor/quote-packages/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, lineItems: lineItemsRaw } = req.body
    let lineItems: Array<{ description: string; quantity: number; unitPrice: number }> | undefined
    if (lineItemsRaw !== undefined) {
      try {
        lineItems = parseLineItems(lineItemsRaw)
      } catch {
        res.status(400).json({ error: 'Invalid line items' })
        return
      }
    }

    const updatePayload: {
      name?: string
      description?: string | null
      lineItems?: Array<{ description: string; quantity: number; unitPrice: number }>
    } = {}
    if (name !== undefined) updatePayload.name = name
    if (description !== undefined) updatePayload.description = description
    if (lineItems !== undefined) updatePayload.lineItems = lineItems

    const pkg = await QuotePackage.update(
      Number(req.params['id']),
      Number(req.user.id),
      updatePayload
    )
    if (!pkg) {
      res.status(404).json({ error: 'Package not found' })
      return
    }
    res.json({ package: pkg })
  } catch (error) {
    logger.error('Update quote package error:', error)
    if (error instanceof Error && error.message === 'LINE_ITEMS_REQUIRED') {
      res.status(400).json({ error: 'At least one line item is required' })
      return
    }
    res.status(500).json({ error: 'Failed to update quote package' })
  }
})

// DELETE /api/vendor/quote-packages/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await QuotePackage.deleteForVendor(
      Number(req.params['id']),
      Number(req.user.id)
    )
    if (!deleted) {
      res.status(404).json({ error: 'Package not found' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    logger.error('Delete quote package error:', error)
    res.status(500).json({ error: 'Failed to delete quote package' })
  }
})

export default router
