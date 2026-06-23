import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { VendorPlanService } from '../services/vendorPlanService'
import {
  createBillingPortalSession,
  createProSubscriptionCheckout,
  getFoundingProAvailability,
  getStripePublishableKey,
  isStripeBillingConfigured,
} from '../services/stripeBillingService'
import { VendorSubscription, isProSubscriptionStatus } from '../models/VendorSubscription'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

async function buildUsageResponse(vendorId: number) {
  const usage = await VendorPlanService.getUsage(vendorId)
  const billing = await VendorSubscription.findByVendorId(vendorId)
  const billingConfigured = isStripeBillingConfigured()
  const hasActiveSubscription = isProSubscriptionStatus(billing?.subscriptionStatus)
  const founding = await getFoundingProAvailability()

  let checkoutTier: 'founding_pro' | 'standard' | null = null
  if (billingConfigured && usage.plan !== 'pro') {
    checkoutTier = founding.available ? 'founding_pro' : 'standard'
  }

  return {
    ...usage,
    billing: {
      configured: billingConfigured,
      canUpgrade: billingConfigured && usage.plan !== 'pro',
      canManage: Boolean(billing?.stripeCustomerId && hasActiveSubscription),
      subscriptionStatus: billing?.subscriptionStatus ?? null,
      stripePublishableKey: billingConfigured ? getStripePublishableKey() : null,
      checkoutTier,
      foundingPro: founding,
    },
  }
}

// GET /api/vendor/plan/usage
router.get('/usage', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usage = await buildUsageResponse(Number(req.user.id))
    res.json({ usage })
  } catch (error) {
    logger.error('Vendor plan usage error:', error)
    res.status(500).json({ error: 'Failed to load plan usage' })
  }
})

// POST /api/vendor/plan/checkout — Stripe Checkout for Pro subscription
router.post('/checkout', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const url = await createProSubscriptionCheckout(Number(req.user.id))
    res.json({ url })
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'STRIPE_BILLING_NOT_CONFIGURED':
          res.status(503).json({
            error:
              'Pro billing is not configured. Add STRIPE_SECRET_KEY and PRO_STRIPE_PRICE_ID (and optionally FOUNDING_PRO_STRIPE_PRICE_ID).',
          })
          return
        case 'FOUNDING_CAP_REACHED':
          res.status(503).json({
            error:
              'Founding Pro spots are full. Add PRO_STRIPE_PRICE_ID for standard pricing.',
          })
          return
        case 'ALREADY_PRO':
          res.status(409).json({ error: 'You already have an active Pro subscription.' })
          return
        case 'VENDOR_NOT_FOUND':
          res.status(404).json({ error: 'Vendor account not found' })
          return
      }
    }
    logger.error('Pro checkout error:', error)
    res.status(500).json({ error: 'Failed to start checkout' })
  }
})

// POST /api/vendor/plan/portal — Stripe Customer Portal (manage/cancel)
router.post('/portal', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const url = await createBillingPortalSession(Number(req.user.id))
    res.json({ url })
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'STRIPE_NOT_CONFIGURED':
          res.status(503).json({ error: 'Stripe is not configured on this server.' })
          return
        case 'NO_BILLING_CUSTOMER':
          res.status(400).json({ error: 'No billing account found. Subscribe to Pro first.' })
          return
      }
    }
    logger.error('Billing portal error:', error)
    res.status(500).json({ error: 'Failed to open billing portal' })
  }
})

export default router
