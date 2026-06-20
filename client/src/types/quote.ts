export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'converted'

export interface QuoteLineItemInput {
  description: string
  quantity: number
  unitPrice: number
}

export interface QuoteContractSummary {
  title: string
  fileName: string
  viewOnly: boolean
  canSign: boolean
  acknowledgedAt: string | null
  acknowledgementLegalName: string | null
}

export interface QuoteLineItem {
  id: number
  quoteId: number
  description: string
  quantity: number
  unitPrice: number
  amount: number
  sortOrder: number
}

export interface Quote {
  id: number
  vendorId: number
  projectId: number | null
  token: string
  status: QuoteStatus
  title: string
  clientEmail: string
  clientName: string | null
  eventDate: string | null
  location: string | null
  notes: string | null
  currency: string
  totalAmount: number
  expiresAt: string
  sentAt: string | null
  respondedAt: string | null
  createdAt: string
  updatedAt: string
  lineItems: QuoteLineItem[]
  contract: QuoteContractSummary | null
}

export interface PublicQuote {
  token: string
  status: QuoteStatus
  title: string
  clientEmail: string
  clientName: string | null
  eventDate: string | null
  location: string | null
  notes: string | null
  currency: string
  totalAmount: number
  expiresAt: string
  vendorBusinessName: string
  lineItems: QuoteLineItem[]
  canRespond: boolean
  contract: QuoteContractSummary | null
}

export interface CreateQuoteInput {
  title: string
  clientEmail: string
  clientName?: string
  eventDate?: string
  location?: string
  notes?: string
  currency?: string
  expiresInDays?: number
  lineItems: QuoteLineItemInput[]
  attachContract?: boolean
  contractTitle?: string
  contractFile?: File
}
