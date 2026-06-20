export type VendorNotificationType =
  | 'quote_accepted'
  | 'quote_declined'
  | 'quote_contract_signed'
  | 'client_joined'
  | 'invoice_payment_claimed'
  | 'invoice_paid'

export interface VendorNotification {
  id: number
  vendorId: number
  type: VendorNotificationType
  title: string
  body: string | null
  linkPath: string | null
  readAt: string | null
  createdAt: string
}

export interface VendorProfile {
  userId: number
  businessName: string
  serviceType: string | null
  tagline: string | null
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  website: string | null
  businessPhone: string | null
  businessEmail: string | null
}
