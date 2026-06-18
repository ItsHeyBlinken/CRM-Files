import { Router, Request, Response } from 'express'
import { handleStripeWebhook } from '../services/stripeService'
import { logger } from '../utils/logger'

const router = Router()

// POST /api/webhooks/stripe
router.post('/stripe', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature']
    const rawBody = req.body as Buffer

    await handleStripeWebhook(rawBody, typeof signature === 'string' ? signature : undefined)
    res.json({ received: true })
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'INVALID_SIGNATURE':
          res.status(400).json({ error: 'Invalid webhook signature' })
          return
        case 'STRIPE_WEBHOOK_NOT_CONFIGURED':
          res.status(503).json({ error: 'Stripe webhook not configured' })
          return
        case 'MISSING_SIGNATURE':
          res.status(400).json({ error: 'Missing Stripe signature header' })
          return
      }
    }

    logger.error('Stripe webhook error:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
})

export default router
