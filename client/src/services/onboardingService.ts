import api from './api'
import type { VendorPaymentSettings } from './paymentSettingsService'

export interface VendorChecklist {
  hasProject: boolean
  hasLinkedClient: boolean
  hasSentInvoice: boolean
}

export interface VendorOnboardingStatus {
  needsOnboarding: boolean
  businessName: string
  paymentSetupComplete: boolean
  hasPaymentMethod: boolean
  stripeConfigured: boolean
  settings: VendorPaymentSettings
}

export interface OnboardingResponse {
  status: VendorOnboardingStatus
  checklist: VendorChecklist
}

export interface CompleteOnboardingInput {
  businessName: string
  venmoHandle?: string | null
  zelleHandle?: string | null
  cashappHandle?: string | null
  paypalHandle?: string | null
  paymentInstructions?: string | null
  skipPaymentSetup?: boolean
}

export async function fetchVendorOnboarding(): Promise<OnboardingResponse> {
  const response = await api.get('/vendor/onboarding')
  return response.data
}

export async function completeVendorOnboarding(
  input: CompleteOnboardingInput
): Promise<VendorOnboardingStatus> {
  const response = await api.post('/vendor/onboarding/complete', input)
  return response.data.status
}
