import { VendorNotification } from '../models/VendorNotification'
import { logger } from '../utils/logger'

async function safeCreate(input: Parameters<typeof VendorNotification.create>[0]): Promise<void> {
  try {
    await VendorNotification.create(input)
  } catch (error) {
    logger.error('Failed to create vendor notification:', error)
  }
}

export async function notifyQuoteAccepted(input: {
  vendorId: number
  quoteId: number
  quoteTitle: string
  clientName: string | null
}): Promise<void> {
  await safeCreate({
    vendorId: input.vendorId,
    type: 'quote_accepted',
    title: 'Quote accepted',
    body: `${input.clientName ?? 'Your client'} accepted "${input.quoteTitle}".`,
    linkPath: `/dashboard/quotes/${input.quoteId}`,
  })
}

export async function notifyQuoteDeclined(input: {
  vendorId: number
  quoteId: number
  quoteTitle: string
  clientName: string | null
}): Promise<void> {
  await safeCreate({
    vendorId: input.vendorId,
    type: 'quote_declined',
    title: 'Quote declined',
    body: `${input.clientName ?? 'Your client'} declined "${input.quoteTitle}".`,
    linkPath: `/dashboard/quotes/${input.quoteId}`,
  })
}

export async function notifyQuoteContractSigned(input: {
  vendorId: number
  quoteId: number
  quoteTitle: string
  legalName: string | null
}): Promise<void> {
  await safeCreate({
    vendorId: input.vendorId,
    type: 'quote_contract_signed',
    title: 'Contract signed on quote',
    body: `${input.legalName ?? 'Your client'} signed the contract for "${input.quoteTitle}".`,
    linkPath: `/dashboard/quotes/${input.quoteId}`,
  })
}

export async function notifyClientJoined(input: {
  vendorId: number
  projectId: number
  projectTitle: string
  clientName: string
}): Promise<void> {
  await safeCreate({
    vendorId: input.vendorId,
    type: 'client_joined',
    title: 'Client joined portal',
    body: `${input.clientName} joined "${input.projectTitle}".`,
    linkPath: `/dashboard/projects/${input.projectId}`,
  })
}

export async function notifyInvoicePaymentClaimed(input: {
  vendorId: number
  projectId: number
  invoiceTitle: string
}): Promise<void> {
  await safeCreate({
    vendorId: input.vendorId,
    type: 'invoice_payment_claimed',
    title: 'Client reported payment',
    body: `Confirm payment for "${input.invoiceTitle}".`,
    linkPath: `/dashboard/projects/${input.projectId}`,
  })
}

export async function notifyInvoicePaid(input: {
  vendorId: number
  projectId: number
  invoiceTitle: string
  paymentMethod: string
}): Promise<void> {
  await safeCreate({
    vendorId: input.vendorId,
    type: 'invoice_paid',
    title: 'Invoice paid',
    body: `"${input.invoiceTitle}" was marked paid (${input.paymentMethod}).`,
    linkPath: `/dashboard/projects/${input.projectId}`,
  })
}
