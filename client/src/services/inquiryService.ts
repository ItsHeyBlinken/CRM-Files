import api from './api'
import type { Inquiry, InquiryInput } from '../types/inquiry'
import type { Quote } from '../types/quote'

export async function fetchVendorInquiries(): Promise<Inquiry[]> {
  const { data } = await api.get<{ inquiries: Inquiry[] }>('/vendor/inquiries')
  return data.inquiries
}

export async function createInquiry(input: InquiryInput): Promise<Inquiry> {
  const { data } = await api.post<{ inquiry: Inquiry }>('/vendor/inquiries', input)
  return data.inquiry
}

export async function updateInquiry(
  id: number,
  input: Partial<InquiryInput>
): Promise<Inquiry> {
  const { data } = await api.put<{ inquiry: Inquiry }>(`/vendor/inquiries/${id}`, input)
  return data.inquiry
}

export async function createQuoteFromInquiry(
  id: number,
  options?: {
    title?: string
    packageId?: number
    lineItems?: Array<{ description: string; quantity: number; unitPrice: number }>
  }
): Promise<{ inquiry: Inquiry; quote: Quote; quotePath: string }> {
  const { data } = await api.post<{
    inquiry: Inquiry
    quote: Quote
    quotePath: string
  }>(`/vendor/inquiries/${id}/create-quote`, options ?? {})
  return data
}
