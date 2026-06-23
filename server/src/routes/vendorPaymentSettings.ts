import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { VendorPaymentSettings } from '../models/VendorPaymentSettings'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

// GET /api/vendor/payment-settings
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await VendorPaymentSettings.findByVendorId(Number(req.user.id))
    res.json({ settings })
  } catch (error) {
    logger.error('Get payment settings error:', error)
    res.status(500).json({ error: 'Failed to load payment settings' })
  }
})

// PUT /api/vendor/payment-settings
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      venmoHandle,
      zelleHandle,
      cashappHandle,
      paypalHandle,
      paymentInstructions,
      stripePaymentLink,
    } = req.body

    const settings = await VendorPaymentSettings.updateSettings(Number(req.user.id), {
      venmoHandle,
      zelleHandle,
      cashappHandle,
      paypalHandle,
      paymentInstructions,
      stripePaymentLink,
    })

    res.json({ settings })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'INVALID_STRIPE_PAYMENT_LINK') {
      res.status(400).json({
        error:
          'Stripe link must be a valid https URL on stripe.com (e.g. a Payment Link from your Stripe Dashboard).',
      })
      return
    }
    logger.error('Update payment settings error:', error)
    res.status(500).json({ error: 'Failed to update payment settings' })
  }
})

export default router
