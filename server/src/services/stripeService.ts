import Stripe from 'stripe'
import { logger } from '../utils/logger'
import {
  handleSubscriptionCheckoutCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from './stripeBillingService'

let stripeClient: Stripe | null = null

function getStripe(): Stripe | null {
  const secretKey = process.env['STRIPE_SECRET_KEY']
  if (!secretKey) {
    return null
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }

  return stripeClient
}

function getFrontendUrl(): string {
  return process.env['FRONTEND_URL'] || process.env['CORS_ORIGIN'] || 'http://localhost:5173'
}

export { getFrontendUrl }

export function isStripeConfigured(): boolean {
  return Boolean(process.env['STRIPE_SECRET_KEY'])
}

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string | undefined
): Promise<void> {
  const stripe = getStripe()
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']

  if (!stripe || !webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_NOT_CONFIGURED')
  }

  if (!signature) {
    throw new Error('MISSING_SIGNATURE')
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    logger.error('Stripe webhook signature verification failed:', err)
    throw new Error('INVALID_SIGNATURE')
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription') {
        await handleSubscriptionCheckoutCompleted(session)
      }
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdated(subscription)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(subscription)
      break
    }
    default:
      break
  }
}
