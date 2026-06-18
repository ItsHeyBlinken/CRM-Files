export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'converted'

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
  weddingDate: string | null
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
}

export interface PublicQuote {
  token: string
  status: QuoteStatus
  title: string
  clientEmail: string
  clientName: string | null
  weddingDate: string | null
  location: string | null
  notes: string | null
  currency: string
  totalAmount: number
  expiresAt: string
  vendorBusinessName: string
  lineItems: QuoteLineItem[]
  canRespond: boolean
}

export interface QuoteLineItemInput {
  description: string
  quantity: number
  unitPrice: number
}

export interface CreateQuoteInput {
  title: string
  clientEmail: string
  clientName?: string
  weddingDate?: string
  location?: string
  notes?: string
  currency?: string
  expiresInDays?: number
  lineItems: QuoteLineItemInput[]
}
