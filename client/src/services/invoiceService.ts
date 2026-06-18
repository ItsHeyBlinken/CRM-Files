import api from './api'
import type { Invoice } from '../types/portal'

export interface CreateInvoiceInput {
  title: string
  invoiceNumber?: string
  description?: string
  amount: number
  currency?: string
  dueDate?: string
  notes?: string
  status?: Invoice['status']
}

export interface UpdateInvoiceInput {
  title?: string
  invoiceNumber?: string | null
  description?: string | null
  amount?: number
  currency?: string
  dueDate?: string | null
  notes?: string | null
  status?: Invoice['status']
}

export async function createProjectInvoice(
  projectId: number,
  input: CreateInvoiceInput
): Promise<Invoice> {
  const response = await api.post(`/vendor/projects/${projectId}/invoices`, input)
  return response.data.invoice
}

export async function updateProjectInvoice(
  projectId: number,
  invoiceId: number,
  input: UpdateInvoiceInput
): Promise<Invoice> {
  const response = await api.put(`/vendor/projects/${projectId}/invoices/${invoiceId}`, input)
  return response.data.invoice
}

export async function deleteProjectInvoice(projectId: number, invoiceId: number): Promise<void> {
  await api.delete(`/vendor/projects/${projectId}/invoices/${invoiceId}`)
}

export async function sendProjectInvoice(projectId: number, invoiceId: number): Promise<Invoice> {
  const response = await api.post(`/vendor/projects/${projectId}/invoices/${invoiceId}/send`)
  return response.data.invoice
}

export async function markProjectInvoicePaid(
  projectId: number,
  invoiceId: number,
  paymentMethod?: string
): Promise<Invoice> {
  const response = await api.post(`/vendor/projects/${projectId}/invoices/${invoiceId}/mark-paid`, {
    paymentMethod,
  })
  return response.data.invoice
}
