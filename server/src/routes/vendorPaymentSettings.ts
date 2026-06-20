import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { VendorPaymentSettings } from '../models/VendorPaymentSettings'
import {
  createConnectOnboardingLink,
  isStripeConfigured,
  refreshConnectAccountStatus,
} from '../services/stripeService'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

// GET /api/vendor/payment-settings
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await VendorPaymentSettings.findByVendorId(Number(req.user.id))
    res.json({
      settings,
      stripeConfigured: isStripeConfigured(),
    })
  } catch (error) {
    logger.error('Get payment settings error:', error)
    res.status(500).json({ error: 'Failed to load payment settings' })
  }
})

// PUT /api/vendor/payment-settings
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { venmoHandle, zelleHandle, cashappHandle, paypalHandle, paymentInstructions } = req.body

    const settings = await VendorPaymentSettings.updateP2PSettings(Number(req.user.id), {
      venmoHandle,
      zelleHandle,
      cashappHandle,
      paypalHandle,
      paymentInstructions,
    })

    res.json({ settings })
  } catch (error) {
    logger.error('Update payment settings error:', error)
    res.status(500).json({ error: 'Failed to update payment settings' })
  }
})

// POST /api/vendor/payment-settings/stripe/connect
router.post('/stripe/connect', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({
        error: 'Card payments are not configured on this server. Add STRIPE_SECRET_KEY to enable.',
      })
      return
    }

    const returnPath =
      typeof req.body.returnPath === 'string' ? req.body.returnPath : '/dashboard/payments'

    const url = await createConnectOnboardingLink(Number(req.user.id), returnPath)
    res.json({ url })
  } catch (error) {
    logger.error('Stripe connect error:', error)
    res.status(500).json({ error: 'Failed to start Stripe setup' })
  }
})

// POST /api/vendor/payment-settings/stripe/refresh
router.post('/stripe/refresh', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Stripe is not configured on this server' })
      return
    }

    const status = await refreshConnectAccountStatus(Number(req.user.id))
    const settings = await VendorPaymentSettings.findByVendorId(Number(req.user.id))
    res.json({ settings, status })
  } catch (error) {
    logger.error('Stripe refresh error:', error)
    res.status(500).json({ error: 'Failed to refresh Stripe status' })
  }
})

export default router
