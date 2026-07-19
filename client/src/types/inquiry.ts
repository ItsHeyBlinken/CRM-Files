export type InquiryStatus = 'new' | 'contacted' | 'quote_sent' | 'booked' | 'lost'

export interface Inquiry {
  id: number
  vendorId: number
  name: string
  email: string
  phone: string | null
  serviceType: string | null
  eventDate: string | null
  budget: number | null
  notes: string | null
  status: InquiryStatus
  quoteId: number | null
  createdAt: string
  updatedAt: string
}

export interface InquiryInput {
  name: string
  email: string
  phone?: string | null
  serviceType?: string | null
  eventDate?: string | null
  budget?: number | null
  notes?: string | null
  status?: InquiryStatus
}

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New Inquiry',
  contacted: 'Contacted',
  quote_sent: 'Quote Sent',
  booked: 'Booked',
  lost: 'Lost / declined',
}

export const INQUIRY_STATUSES: InquiryStatus[] = [
  'new',
  'contacted',
  'quote_sent',
  'booked',
  'lost',
]

/** Shown in the default Active list (pipeline still open). */
export const INQUIRY_ACTIVE_STATUSES: InquiryStatus[] = ['new', 'contacted', 'quote_sent']

export type InquiryListFilter = 'active' | 'booked' | 'lost' | 'all'

export function inquiryMatchesFilter(
  status: InquiryStatus,
  filter: InquiryListFilter
): boolean {
  switch (filter) {
    case 'active':
      return INQUIRY_ACTIVE_STATUSES.includes(status)
    case 'booked':
      return status === 'booked'
    case 'lost':
      return status === 'lost'
    case 'all':
      return true
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}
