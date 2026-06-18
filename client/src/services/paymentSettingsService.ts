import api from './api'

export interface VendorPaymentSettings {
  vendorId: number
  stripeAccountId: string | null
  stripeChargesEnabled: boolean
  stripeOnboardingComplete: boolean
  venmoHandle: string | null
  zelleHandle: string | null
  cashappHandle: string | null
  paypalHandle: string | null
  paymentInstructions: string | null
}

export interface PaymentSettingsResponse {
  settings: VendorPaymentSettings
  stripeConfigured: boolean
}

export interface UpdatePaymentSettingsInput {
  venmoHandle?: string | null
  zelleHandle?: string | null
  cashappHandle?: string | null
  paypalHandle?: string | null
  paymentInstructions?: string | null
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

export async function startStripeConnect(): Promise<string> {
  const response = await api.post('/vendor/payment-settings/stripe/connect')
  return response.data.url
}

export async function refreshStripeConnectStatus(): Promise<PaymentSettingsResponse> {
  const response = await api.post('/vendor/payment-settings/stripe/refresh')
  return { settings: response.data.settings, stripeConfigured: true }
}
