import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { VendorOnboarding } from '../models/VendorOnboarding'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

// GET /api/vendor/onboarding
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = await VendorOnboarding.getStatus(Number(req.user.id))
    const checklist = await VendorOnboarding.getChecklist(Number(req.user.id))
    res.json({ status, checklist })
  } catch (error) {
    logger.error('Get onboarding status error:', error)
    res.status(500).json({ error: 'Failed to load onboarding status' })
  }
})

// POST /api/vendor/onboarding/complete
router.post('/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      businessName,
      venmoHandle,
      zelleHandle,
      cashappHandle,
      paypalHandle,
      paymentInstructions,
      stripePaymentLink,
      skipPaymentSetup,
    } = req.body

    const status = await VendorOnboarding.completeOnboarding(Number(req.user.id), {
      businessName,
      venmoHandle,
      zelleHandle,
      cashappHandle,
      paypalHandle,
      paymentInstructions,
      stripePaymentLink,
      skipPaymentSetup,
    })

    res.json({ status })
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'BUSINESS_NAME_REQUIRED':
          res.status(400).json({ error: 'Business name is required' })
          return
        case 'PAYMENT_METHOD_REQUIRED':
          res.status(400).json({
            error: 'Add at least one payment method, add a Stripe link, or choose “Set up later”',
          })
          return
        case 'INVALID_STRIPE_PAYMENT_LINK':
          res.status(400).json({
            error:
              'Stripe link must be a valid https URL on stripe.com (e.g. a Payment Link from your Stripe Dashboard).',
          })
          return
      }
    }
    logger.error('Complete onboarding error:', error)
    res.status(500).json({ error: 'Failed to complete onboarding' })
  }
})

export default router
