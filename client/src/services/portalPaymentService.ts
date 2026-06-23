import api from './api'
import type { Invoice } from '../types/portal'

export async function claimInvoicePaymentSent(
  invoiceId: number,
  note?: string
): Promise<Invoice> {
  const response = await api.post(`/portal/invoices/${invoiceId}/claim-sent`, { note })
  return response.data.invoice
}
