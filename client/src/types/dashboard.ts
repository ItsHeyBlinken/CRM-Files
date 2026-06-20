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
