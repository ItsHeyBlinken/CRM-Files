import Stripe from 'stripe'
import { logger } from '../utils/logger'
import { Invoice, IInvoice } from '../models/Invoice'
import { Project } from '../models/Project'
import { VendorPaymentSettings } from '../models/VendorPaymentSettings'
import { notifyInvoicePaid } from './notificationService'
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

export function isStripeConfigured(): boolean {
  return Boolean(process.env['STRIPE_SECRET_KEY'])
}

export async function createConnectAccount(vendorId: number): Promise<string> {
  const stripe = getStripe()
  if (!stripe) {
    throw new Error('STRIPE_NOT_CONFIGURED')
  }

  const settings = await VendorPaymentSettings.findByVendorId(vendorId)
  if (settings.stripeAccountId) {
    return settings.stripeAccountId
  }

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  await VendorPaymentSettings.setStripeAccountId(vendorId, account.id)
  return account.id
}

export async function createConnectOnboardingLink(
  vendorId: number,
  returnPath = '/dashboard/payments'
): Promise<string> {
  const stripe = getStripe()
  if (!stripe) {
    throw new Error('STRIPE_NOT_CONFIGURED')
  }

  const accountId = await createConnectAccount(vendorId)
  const frontendUrl = getFrontendUrl()
  const safePath = returnPath.startsWith('/') ? returnPath : '/dashboard/payments'

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${frontendUrl}${safePath}?stripe=refresh`,
    return_url: `${frontendUrl}${safePath}?stripe=return`,
    type: 'account_onboarding',
  })

  return accountLink.url
}

export async function refreshConnectAccountStatus(vendorId: number): Promise<{
  chargesEnabled: boolean
  onboardingComplete: boolean
}> {
  const stripe = getStripe()
  if (!stripe) {
    throw new Error('STRIPE_NOT_CONFIGURED')
  }

  const settings = await VendorPaymentSettings.findByVendorId(vendorId)
  if (!settings.stripeAccountId) {
    return { chargesEnabled: false, onboardingComplete: false }
  }

  const account = await stripe.accounts.retrieve(settings.stripeAccountId)
  const chargesEnabled = Boolean(account.charges_enabled)
  const onboardingComplete = Boolean(account.details_submitted)

  await VendorPaymentSettings.updateStripeStatus(vendorId, chargesEnabled, onboardingComplete)

  return { chargesEnabled, onboardingComplete }
}

export async function createInvoiceCheckoutSession(
  invoice: IInvoice,
  vendorId: number,
  clientUserId: number
): Promise<string> {
  const stripe = getStripe()
  if (!stripe) {
    throw new Error('STRIPE_NOT_CONFIGURED')
  }

  if (invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'draft') {
    throw new Error('INVOICE_NOT_PAYABLE')
  }

  const settings = await VendorPaymentSettings.findByVendorId(vendorId)
  if (!settings.stripeAccountId || !settings.stripeChargesEnabled) {
    throw new Error('STRIPE_NOT_READY')
  }

  const frontendUrl = getFrontendUrl()
  const unitAmount = Math.round(invoice.amount * 100)

  if (unitAmount < 50) {
    throw new Error('AMOUNT_TOO_SMALL')
  }

  const productData: { name: string; description?: string } = {
    name: invoice.title,
  }
  if (invoice.description) {
    productData.description = invoice.description
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: productData,
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      transfer_data: {
        destination: settings.stripeAccountId,
      },
    },
    metadata: {
      invoice_id: String(invoice.id),
      project_id: String(invoice.projectId),
      client_user_id: String(clientUserId),
    },
    success_url: `${frontendUrl}/portal?payment=success&invoice=${invoice.id}`,
    cancel_url: `${frontendUrl}/portal?tab=payments&payment=cancelled`,
  })

  if (!session.url) {
    throw new Error('CHECKOUT_SESSION_FAILED')
  }

  await Invoice.setCheckoutSessionId(invoice.id, session.id)
  return session.url
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
        break
      }

      const invoiceId = session.metadata?.['invoice_id']
      if (!invoiceId || session.payment_status !== 'paid') {
        return
      }

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null

      const paidInvoice = await Invoice.markPaidFromStripe(Number(invoiceId), session.id, paymentIntentId)
      if (paidInvoice) {
        const project = await Project.findById(paidInvoice.projectId)
        if (project) {
          await notifyInvoicePaid({
            vendorId: project.vendorId,
            projectId: project.id,
            invoiceTitle: paidInvoice.title,
            paymentMethod: 'stripe',
          })
        }
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
