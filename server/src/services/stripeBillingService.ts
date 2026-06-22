import Stripe from 'stripe'
import { User } from '../models/User'
import { VendorSubscription, isProSubscriptionStatus } from '../models/VendorSubscription'
import { logger } from '../utils/logger'

const CHECKOUT_TYPE = 'vendor_subscription'

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

export function getProStripePriceId(): string | null {
  const priceId = process.env['PRO_STRIPE_PRICE_ID']?.trim()
  return priceId || null
}

export function getStripePublishableKey(): string | null {
  const key = process.env['STRIPE_PUBLISHABLE_KEY']?.trim()
  return key || null
}

export function isStripeBillingConfigured(): boolean {
  return Boolean(process.env['STRIPE_SECRET_KEY'] && getProStripePriceId())
}

async function getOrCreateStripeCustomer(vendorId: number, email: string): Promise<string> {
  const stripe = getStripe()
  if (!stripe) {
    throw new Error('STRIPE_NOT_CONFIGURED')
  }

  const billing = await VendorSubscription.findByVendorId(vendorId)
  if (billing?.stripeCustomerId) {
    return billing.stripeCustomerId
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { vendor_id: String(vendorId) },
  })

  await VendorSubscription.setStripeCustomerId(vendorId, customer.id)
  return customer.id
}

export async function createProSubscriptionCheckout(vendorId: number): Promise<string> {
  const stripe = getStripe()
  const priceId = getProStripePriceId()

  if (!stripe || !priceId) {
    throw new Error('STRIPE_BILLING_NOT_CONFIGURED')
  }

  const billing = await VendorSubscription.findByVendorId(vendorId)
  if (billing?.plan === 'pro') {
    throw new Error('ALREADY_PRO')
  }

  const user = await User.findById(String(vendorId))
  if (!user?.email) {
    throw new Error('VENDOR_NOT_FOUND')
  }

  const customerId = await getOrCreateStripeCustomer(vendorId, user.email)
  const frontendUrl = getFrontendUrl()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${frontendUrl}/dashboard?billing=success`,
    cancel_url: `${frontendUrl}/dashboard?billing=cancelled`,
    metadata: {
      checkout_type: CHECKOUT_TYPE,
      vendor_id: String(vendorId),
    },
    subscription_data: {
      metadata: {
        vendor_id: String(vendorId),
      },
    },
  })

  if (!session.url) {
    throw new Error('CHECKOUT_SESSION_FAILED')
  }

  return session.url
}

export async function createBillingPortalSession(vendorId: number): Promise<string> {
  const stripe = getStripe()
  if (!stripe) {
    throw new Error('STRIPE_NOT_CONFIGURED')
  }

  const billing = await VendorSubscription.findByVendorId(vendorId)
  if (!billing?.stripeCustomerId) {
    throw new Error('NO_BILLING_CUSTOMER')
  }

  const frontendUrl = getFrontendUrl()
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${frontendUrl}/dashboard/settings?billing=return`,
  })

  return session.url
}

function resolveVendorIdFromSubscription(subscription: Stripe.Subscription): number | null {
  const raw = subscription.metadata?.['vendor_id']
  if (raw) {
    const id = Number(raw)
    return Number.isFinite(id) ? id : null
  }
  return null
}

async function syncSubscription(subscription: Stripe.Subscription, vendorId: number): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  const priceId = subscription.items.data[0]?.price?.id ?? null

  if (isProSubscriptionStatus(subscription.status)) {
    await VendorSubscription.applySubscription(vendorId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      stripePriceId: priceId,
    })
    return
  }

  await VendorSubscription.clearSubscription(vendorId, subscription.status)
}

export async function handleSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (session.metadata?.['checkout_type'] !== CHECKOUT_TYPE) {
    return
  }

  const vendorId = Number(session.metadata?.['vendor_id'])
  if (!Number.isFinite(vendorId)) {
    logger.warn('Subscription checkout missing vendor_id metadata', { sessionId: session.id })
    return
  }

  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

  if (!subscriptionId) {
    logger.warn('Subscription checkout missing subscription id', { sessionId: session.id })
    return
  }

  const stripe = getStripe()
  if (!stripe) {
    throw new Error('STRIPE_NOT_CONFIGURED')
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await syncSubscription(subscription, vendorId)
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const vendorId = resolveVendorIdFromSubscription(subscription)
  if (!vendorId) {
    return
  }
  await syncSubscription(subscription, vendorId)
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const vendorId = resolveVendorIdFromSubscription(subscription)
  if (!vendorId) {
    return
  }
  await VendorSubscription.clearSubscription(vendorId, 'canceled')
}
