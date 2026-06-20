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
  if (input.attachContract && input.contractFile) {
    const formData = new FormData()
    formData.append('title', input.title)
    formData.append('clientEmail', input.clientEmail)
    if (input.clientName) formData.append('clientName', input.clientName)
    if (input.weddingDate) formData.append('weddingDate', input.weddingDate)
    if (input.location) formData.append('location', input.location)
    if (input.notes) formData.append('notes', input.notes)
    if (input.currency) formData.append('currency', input.currency)
    if (input.expiresInDays != null) formData.append('expiresInDays', String(input.expiresInDays))
    formData.append('lineItems', JSON.stringify(input.lineItems))
    formData.append('attachContract', 'true')
    formData.append('contractTitle', input.contractTitle?.trim() || 'Service agreement')
    formData.append('contractFile', input.contractFile)

    const response = await api.post('/vendor/quotes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  const { attachContract: _attachContract, contractTitle: _contractTitle, contractFile: _contractFile, ...jsonBody } =
    input
  const response = await api.post('/vendor/quotes', jsonBody)
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

export interface QuoteContractSigningContext {
  title: string
  pdfHash: string
  suggestedLegalName: string
  minViewSeconds: number
  consentVersion: string
  consentText: string
  viewOnly: boolean
  canSign: boolean
  alreadyAcknowledged: boolean
  acknowledgedAt: string | null
  acknowledgementLegalName: string | null
}

export interface AcknowledgeQuoteContractInput {
  legalName: string
  pdfHash: string
  viewDurationSeconds: number
  scrolledToEnd: boolean
  consentAccepted: boolean
}

export async function fetchQuoteContractSigningContext(
  token: string
): Promise<QuoteContractSigningContext> {
  const response = await api.get(`/quotes/${token}/contract/signing-context`)
  return response.data.context
}

export async function fetchQuoteContractPdfBlob(token: string): Promise<Blob> {
  const response = await api.get(`/quotes/${token}/contract`, { responseType: 'blob' })
  return response.data
}

export async function acknowledgeQuoteContract(
  token: string,
  input: AcknowledgeQuoteContractInput
): Promise<PublicQuote> {
  const response = await api.post(`/quotes/${token}/contract/acknowledge`, input)
  return response.data.quote
}

export function getPublicQuoteContractUrl(token: string): string {
  const apiBaseURL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'
  return `${apiBaseURL}/quotes/${token}/contract`
}

export function getVendorQuoteContractUrl(quoteId: number): string {
  const apiBaseURL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'
  return `${apiBaseURL}/vendor/quotes/${quoteId}/contract`
}

export async function openVendorQuoteContract(quoteId: number): Promise<void> {
  const response = await api.get(`/vendor/quotes/${quoteId}/contract`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function acceptQuote(token: string): Promise<PublicQuote> {
  const response = await api.post(`/quotes/${token}/accept`)
  return response.data.quote
}

export async function declineQuote(token: string): Promise<PublicQuote> {
  const response = await api.post(`/quotes/${token}/decline`)
  return response.data.quote
}
