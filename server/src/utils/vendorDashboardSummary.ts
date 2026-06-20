export type VendorAttentionKind =
  | 'quote_awaiting_response'
  | 'quote_ready_to_convert'
  | 'quote_contract_unsigned'
  | 'project_needs_invite'
  | 'invoice_payment_claimed'

export interface VendorAttentionItem {
  id: string
  kind: VendorAttentionKind
  title: string
  subtitle: string
  linkPath: string
  priority: number
}

export interface VendorDashboardStats {
  quotesAwaitingResponse: number
  quotesReadyToConvert: number
  upcomingEvents: number
  paymentClaimsPending: number
}

export interface VendorDashboardSummary {
  stats: VendorDashboardStats
  attention: VendorAttentionItem[]
  upcomingEvents: Array<{
    id: string
    title: string
    eventDate: string
    kind: 'project' | 'quote_tentative'
    linkPath: string
  }>
}

export interface VendorDashboardQuoteInput {
  id: number
  title: string
  status: string
  expiresAt: Date
  clientName: string | null
  clientEmail: string
  projectId: number | null
  contract: {
    acknowledgedAt: Date | null
  } | null
}

export interface VendorDashboardProjectInput {
  id: number
  title: string
  clientEmail: string | null
  hasLinkedClient: boolean
}

export interface VendorDashboardInvoiceInput {
  id: number
  projectId: number
  title: string
  status: string
  clientPaymentClaimedAt: Date | null
}

export interface VendorDashboardCalendarEventInput {
  id: string
  title: string
  eventDate: string
  kind: 'project' | 'quote_tentative'
  linkPath: string
}

function isQuoteExpired(expiresAt: Date, status: string): boolean {
  if (status === 'expired') {
    return true
  }
  return new Date(expiresAt) <= new Date()
}

export function buildVendorDashboardSummary(input: {
  quotes: VendorDashboardQuoteInput[]
  projects: VendorDashboardProjectInput[]
  invoices: VendorDashboardInvoiceInput[]
  calendarEvents: VendorDashboardCalendarEventInput[]
}): VendorDashboardSummary {
  const attention: VendorAttentionItem[] = []
  let quotesAwaitingResponse = 0
  let quotesReadyToConvert = 0
  let paymentClaimsPending = 0

  for (const quote of input.quotes) {
    if (quote.status === 'sent' && !isQuoteExpired(quote.expiresAt, quote.status)) {
      quotesAwaitingResponse += 1
      attention.push({
        id: `quote-awaiting-${quote.id}`,
        kind: 'quote_awaiting_response',
        title: quote.title,
        subtitle: `${quote.clientName || quote.clientEmail} has not responded yet`,
        linkPath: `/dashboard/quotes/${quote.id}`,
        priority: 20,
      })
    }

    if (quote.status === 'accepted' && !quote.projectId) {
      quotesReadyToConvert += 1
      attention.push({
        id: `quote-convert-${quote.id}`,
        kind: 'quote_ready_to_convert',
        title: quote.title,
        subtitle: 'Accepted — convert to a project to continue',
        linkPath: `/dashboard/quotes/${quote.id}`,
        priority: 10,
      })
    }

    if (
      quote.status === 'accepted' &&
      quote.contract &&
      !quote.contract.acknowledgedAt
    ) {
      attention.push({
        id: `quote-contract-${quote.id}`,
        kind: 'quote_contract_unsigned',
        title: quote.title,
        subtitle: 'Contract not signed yet — follow up with your client',
        linkPath: `/dashboard/quotes/${quote.id}`,
        priority: 5,
      })
    }
  }

  for (const project of input.projects) {
    if (!project.hasLinkedClient && project.clientEmail?.trim()) {
      attention.push({
        id: `project-invite-${project.id}`,
        kind: 'project_needs_invite',
        title: project.title,
        subtitle: 'Send a portal invite to your client',
        linkPath: `/dashboard/projects/${project.id}`,
        priority: 30,
      })
    }
  }

  for (const invoice of input.invoices) {
    if (
      invoice.clientPaymentClaimedAt &&
      (invoice.status === 'sent' || invoice.status === 'overdue')
    ) {
      paymentClaimsPending += 1
      attention.push({
        id: `invoice-claim-${invoice.id}`,
        kind: 'invoice_payment_claimed',
        title: invoice.title,
        subtitle: 'Client reported payment — confirm and mark paid',
        linkPath: `/dashboard/projects/${invoice.projectId}`,
        priority: 1,
      })
    }
  }

  const todayKey = new Date().toISOString().slice(0, 10)
  const upcomingEvents = input.calendarEvents
    .filter((event) => event.eventDate >= todayKey)
    .slice(0, 6)

  attention.sort((a, b) => a.priority - b.priority)

  return {
    stats: {
      quotesAwaitingResponse,
      quotesReadyToConvert,
      upcomingEvents: upcomingEvents.length,
      paymentClaimsPending,
    },
    attention: attention.slice(0, 12),
    upcomingEvents,
  }
}
