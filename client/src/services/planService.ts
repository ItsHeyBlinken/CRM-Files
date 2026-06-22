import api from './api'
import type { VendorPlanUsage } from '../types/plan'

export async function fetchVendorPlanUsage(): Promise<VendorPlanUsage> {
  const response = await api.get('/vendor/plan/usage')
  return response.data.usage
}

export async function startProCheckout(): Promise<string> {
  const response = await api.post('/vendor/plan/checkout')
  return response.data.url as string
}

export async function openBillingPortal(): Promise<string> {
  const response = await api.post('/vendor/plan/portal')
  return response.data.url as string
}
