import nodemailer from 'nodemailer'
import { logger } from '../utils/logger'

export interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export interface SendEmailResult {
  sent: boolean
  skippedReason?: string
}

function isEmailConfigured(): boolean {
  return Boolean(process.env['SMTP_HOST'] && process.env['SMTP_FROM'])
}

function getFrontendUrl(): string {
  return process.env['FRONTEND_URL'] || process.env['CORS_ORIGIN'] || 'http://localhost:5173'
}

export function getPublicAppUrl(path: string): string {
  const base = getFrontendUrl().replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    logger.warn('Transactional email skipped — SMTP_HOST or SMTP_FROM not configured')
    return { sent: false, skippedReason: 'EMAIL_NOT_CONFIGURED' }
  }

  const transporter = nodemailer.createTransport({
    host: process.env['SMTP_HOST'],
    port: Number(process.env['SMTP_PORT'] || 587),
    secure: process.env['SMTP_SECURE'] === 'true',
    auth:
      process.env['SMTP_USER'] && process.env['SMTP_PASS']
        ? {
            user: process.env['SMTP_USER'],
            pass: process.env['SMTP_PASS'],
          }
        : undefined,
  })

  try {
    await transporter.sendMail({
      from: process.env['SMTP_FROM'],
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, '<br />'),
    })
    return { sent: true }
  } catch (error) {
    logger.error('Transactional email failed:', error)
    return { sent: false, skippedReason: 'EMAIL_SEND_FAILED' }
  }
}

export async function sendQuoteEmail(input: {
  to: string
  clientName?: string | null
  vendorBusinessName: string
  quoteTitle: string
  quoteUrl: string
  totalLabel: string
  hasContract: boolean
}): Promise<SendEmailResult> {
  const greeting = input.clientName ? `Hi ${input.clientName},` : 'Hi,'
  const contractLine = input.hasContract
    ? 'We included our service agreement with this quote — you can review it from the same link before accepting.\n\n'
    : ''

  return sendTransactionalEmail({
    to: input.to,
    subject: `Your quote — ${input.quoteTitle}`,
    text:
      `${greeting}\n\n` +
      `${input.vendorBusinessName} sent you a quote.\n\n` +
      `Open the link below to review and accept or decline — no account needed:\n\n` +
      `${input.quoteUrl}\n\n` +
      contractLine +
      `Total: ${input.totalLabel}\n\n` +
      `Questions? Reply to this email and we'll get back to you.\n`,
  })
}

export async function sendInviteEmail(input: {
  to: string
  vendorBusinessName: string
  projectTitle: string
  inviteUrl: string
}): Promise<SendEmailResult> {
  return sendTransactionalEmail({
    to: input.to,
    subject: `You're invited — ${input.projectTitle}`,
    text:
      `Hi,\n\n` +
      `${input.vendorBusinessName} invited you to your client portal for ${input.projectTitle}.\n\n` +
      `Create your account and view project details here:\n\n` +
      `${input.inviteUrl}\n\n` +
      `This link is just for you — keep it handy for contracts, invoices, and files.\n`,
  })
}

export async function sendInvoiceEmail(input: {
  to: string
  vendorBusinessName: string
  projectTitle: string
  invoiceTitle: string
  amountLabel: string
  portalUrl: string
}): Promise<SendEmailResult> {
  return sendTransactionalEmail({
    to: input.to,
    subject: `Invoice ready — ${input.invoiceTitle}`,
    text:
      `Hi,\n\n` +
      `${input.vendorBusinessName} sent an invoice for ${input.projectTitle}.\n\n` +
      `Invoice: ${input.invoiceTitle}\n` +
      `Amount: ${input.amountLabel}\n\n` +
      `Pay securely in your client portal:\n\n` +
      `${input.portalUrl}\n`,
  })
}
