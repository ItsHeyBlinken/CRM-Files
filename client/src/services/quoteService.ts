import api from './api'
import type { CreateQuoteInput, PublicQuote, Quote } from '../types/quote'

export async function fetchVendorQuotes(): Promise<Quote[]> {
  const response = await api.get('/vendor/quotes')
  return response.data.quotes
}

export interface QuoteDetailResult {
  quote: Quote
  quotePath: string
}

export async function fetchVendorQuote(quoteId: number): Promise<QuoteDetailResult> {
  const response = await api.get(`/vendor/quotes/${quoteId}`)
  return response.data
}

export async function createQuote(input: CreateQuoteInput): Promise<QuoteDetailResult> {
  const response = await api.post('/vendor/quotes', input)
  return response.data
}

export async function convertQuoteToProject(quoteId: number): Promise<{ quote: Quote; projectId: number }> {
  const response = await api.post(`/vendor/quotes/${quoteId}/convert-to-project`)
  return response.data
}

export async function fetchPublicQuote(token: string): Promise<PublicQuote> {
  const response = await api.get(`/quotes/${token}`)
  return response.data.quote
}

export async function acceptQuote(token: string): Promise<PublicQuote> {
  const response = await api.post(`/quotes/${token}/accept`)
  return response.data.quote
}

export async function declineQuote(token: string): Promise<PublicQuote> {
  const response = await api.post(`/quotes/${token}/decline`)
  return response.data.quote
}
