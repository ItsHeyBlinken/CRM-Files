import { getPool } from '../config/database'
import { Inquiry } from '../models/Inquiry'
import { Invoice } from '../models/Invoice'
import { Quote } from '../models/Quote'
import { Project } from '../models/Project'
import { getPublicAppUrl, sendInviteEmail } from './emailService'
import { logger } from '../utils/logger'

export interface AutoConvertResult {
  converted: boolean
  projectId: number | null
  inviteToken: string | null
  invitePath: string | null
  invoiceId: number | null
  reason?: string
}

/**
 * Auto-convert an accepted quote into a project with deposit invoice + portal invite.
 * Trigger: accept (no contract) OR contract signed after accept (contract attached).
 */
export async function tryAutoConvertAcceptedQuote(
  quoteToken: string
): Promise<AutoConvertResult> {
  const quote = await Quote.findByToken(quoteToken)
  if (!quote) {
    return {
      converted: false,
      projectId: null,
      inviteToken: null,
      invitePath: null,
      invoiceId: null,
      reason: 'NOT_FOUND',
    }
  }

  const meta = await Quote.findVendorMetaByToken(quoteToken)
  if (!meta) {
    return {
      converted: false,
      projectId: null,
      inviteToken: null,
      invitePath: null,
      invoiceId: null,
      reason: 'NO_META',
    }
  }

  const vendorQuote = await Quote.findByIdForVendor(meta.quoteId, meta.vendorId)
  if (!vendorQuote) {
    return {
      converted: false,
      projectId: null,
      inviteToken: null,
      invitePath: null,
      invoiceId: null,
      reason: 'NOT_FOUND',
    }
  }

  if (vendorQuote.status === 'converted' || vendorQuote.projectId) {
    return {
      converted: false,
      projectId: vendorQuote.projectId,
      inviteToken: null,
      invitePath: null,
      invoiceId: null,
      reason: 'ALREADY_CONVERTED',
    }
  }

  if (vendorQuote.status !== 'accepted') {
    return {
      converted: false,
      projectId: null,
      inviteToken: null,
      invitePath: null,
      invoiceId: null,
      reason: 'NOT_ACCEPTED',
    }
  }

  if (vendorQuote.contract && !vendorQuote.contract.acknowledgedAt) {
    return {
      converted: false,
      projectId: null,
      inviteToken: null,
      invitePath: null,
      invoiceId: null,
      reason: 'AWAITING_CONTRACT',
    }
  }

  try {
    const { projectId } = await Quote.convertToProject(meta.quoteId, meta.vendorId)
    await Inquiry.markBookedByQuoteId(meta.quoteId, meta.vendorId)

    const depositAmount = Math.round(vendorQuote.totalAmount * 0.25 * 100) / 100
    let invoiceId: number | null = null
    try {
      const invoice = await Invoice.create(projectId, meta.vendorId, {
        title: 'Deposit to hold your date',
        description: `25% deposit for ${vendorQuote.title}`,
        amount: depositAmount,
        currency: vendorQuote.currency,
        status: 'sent',
        invoiceKind: 'deposit',
        isDateHoldingDeposit: true,
      })
      invoiceId = invoice.id
    } catch (invoiceError) {
      logger.error('Auto-convert deposit invoice failed:', invoiceError)
    }

    try {
      const pool = getPool()
      const milestones = [
        { title: 'Deposit received', sort: 0 },
        { title: 'Event day', sort: 1 },
        { title: 'Delivery', sort: 2 },
      ]
      for (const m of milestones) {
        await pool.query(
          `
          INSERT INTO milestones (
            project_id, title, description, due_date, status, client_visible, sort_order
          ) VALUES ($1, $2, NULL, $3, 'pending', true, $4)
          `,
          [
            projectId,
            m.title,
            m.title === 'Event day' && vendorQuote.eventDate ? vendorQuote.eventDate : null,
            m.sort,
          ]
        )
      }
    } catch (milestoneError) {
      logger.error('Auto-convert milestones failed:', milestoneError)
    }

    let inviteToken: string | null = null
    let invitePath: string | null = null
    try {
      const invite = await Project.createInvite(
        projectId,
        meta.vendorId,
        vendorQuote.clientEmail
      )
      inviteToken = invite.token
      invitePath = `/invite/${invite.token}`
      const fullUrl = getPublicAppUrl(invitePath)
      await sendInviteEmail({
        to: invite.email,
        inviteUrl: fullUrl,
        projectTitle: vendorQuote.title,
        vendorBusinessName: quote.vendorBusinessName,
      })
    } catch (inviteError) {
      logger.error('Auto-convert portal invite failed:', inviteError)
    }

    return {
      converted: true,
      projectId,
      inviteToken,
      invitePath,
      invoiceId,
    }
  } catch (error) {
    logger.error('Auto-convert failed:', error)
    return {
      converted: false,
      projectId: null,
      inviteToken: null,
      invitePath: null,
      invoiceId: null,
      reason: error instanceof Error ? error.message : 'CONVERT_FAILED',
    }
  }
}
