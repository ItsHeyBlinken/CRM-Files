import { Router, Request, Response } from 'express'
import { Quote } from '../models/Quote'
import { logger } from '../utils/logger'

const router = Router()

// GET /api/quotes/:token — public quote view
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Quote token is required' })
      return
    }

    const quote = await Quote.findByToken(token)

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' })
      return
    }

    res.json({ quote })
  } catch (error) {
    logger.error('Public quote lookup error:', error)
    res.status(500).json({ error: 'Failed to load quote' })
  }
})

// POST /api/quotes/:token/accept
router.post('/:token/accept', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Quote token is required' })
      return
    }

    const quote = await Quote.respondToQuote(token, 'accepted')

    if (!quote) {
      res.status(410).json({ error: 'This quote is no longer available to accept' })
      return
    }

    res.json({ quote })
  } catch (error) {
    logger.error('Accept quote error:', error)
    res.status(500).json({ error: 'Failed to accept quote' })
  }
})

// POST /api/quotes/:token/decline
router.post('/:token/decline', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Quote token is required' })
      return
    }

    const quote = await Quote.respondToQuote(token, 'declined')

    if (!quote) {
      res.status(410).json({ error: 'This quote is no longer available to decline' })
      return
    }

    res.json({ quote })
  } catch (error) {
    logger.error('Decline quote error:', error)
    res.status(500).json({ error: 'Failed to decline quote' })
  }
})

export default router
