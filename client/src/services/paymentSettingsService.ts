import api from './api'

export interface VendorPaymentSettings {
  vendorId: number
  stripePaymentLink: string | null
  venmoHandle: string | null
  zelleHandle: string | null
  cashappHandle: string | null
  paypalHandle: string | null
  paymentInstructions: string | null
  paymentSetupComplete: boolean
}

export interface PaymentSettingsResponse {
  settings: VendorPaymentSettings
}

export interface UpdatePaymentSettingsInput {
  venmoHandle?: string | null
  zelleHandle?: string | null
  cashappHandle?: string | null
  paypalHandle?: string | null
  paymentInstructions?: string | null
  stripePaymentLink?: string | null
}

export async function fetchPaymentSettings(): Promise<PaymentSettingsResponse> {
  const response = await api.get('/vendor/payment-settings')
  return response.data
}

export async function updatePaymentSettings(
  input: UpdatePaymentSettingsInput
): Promise<VendorPaymentSettings> {
  const response = await api.put('/vendor/payment-settings', input)
  return response.data.settings
}
