import api from './api'
import type { VendorDashboardSummary } from '../types/dashboard'

export async function fetchVendorDashboardSummary(): Promise<VendorDashboardSummary> {
  const response = await api.get('/vendor/dashboard')
  return response.data.summary
}
