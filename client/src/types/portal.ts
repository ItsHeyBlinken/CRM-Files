export type ProjectStatus =
  | 'inquiry'
  | 'booked'
  | 'in_progress'
  | 'delivered'
  | 'complete'
  | 'cancelled'

export interface Project {
  id: number
  vendorId: number
  title: string
  description: string | null
  eventDate: string | null
  location: string | null
  status: ProjectStatus
  clientDisplayName: string | null
  clientEmail: string | null
  internalNotes?: string | null
}

export interface LinkedClient {
  email: string
  clientDisplayName: string | null
  linkedAt: string
}

export interface VendorProjectDetail {
  project: Project
  linkedClient: LinkedClient | null
  paymentSettings: ProjectPaymentSettings
  paymentSummary: ProjectPaymentSummary
  contracts: Array<{
    id: number
    title: string
    fileName: string
    fileAvailable: boolean
    acknowledgedAt: string | null
    acknowledgementLegalName?: string | null
    createdAt: string
  }>
  milestones: Milestone[]
  invoices: Invoice[]
}

export interface Milestone {
  id: number
  title: string
  description: string | null
  dueDate: string | null
  status: 'pending' | 'in_progress' | 'complete'
  clientVisible?: boolean
}

export interface Invoice {
  id: number
  invoiceNumber: string | null
  title: string
  description: string | null
  amount: number
  currency: string
  dueDate: string | null
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  invoiceKind: 'deposit' | 'payment' | 'final' | 'custom'
  isDateHoldingDeposit: boolean
  paidAt?: string | null
  paymentMethod?: string | null
  clientPaymentClaimedAt?: string | null
  clientPaymentNote?: string | null
}

export interface ClientPaymentOptions {
  stripeEnabled: boolean
  venmoHandle: string | null
  zelleHandle: string | null
  cashappHandle: string | null
  paypalHandle: string | null
  paymentInstructions: string | null
}

export interface ProjectPaymentSettings {
  projectTotal: number | null
  paymentPlanType: 'pay_in_full' | 'deposit_and_balance' | 'split_payments'
  depositType: 'fixed' | 'percentage' | null
  depositValue: number | null
  secondPaymentDueDaysBeforeEvent: number | null
  finalPaymentDueDaysBeforeEvent: number | null
}

export interface ProjectPaymentSummary {
  amountPaid: number
  amountOutstanding: number
  depositStatus: 'not_applicable' | 'not_sent' | 'unpaid' | 'paid'
  nextSuggestedInvoiceKind: 'deposit' | 'payment' | 'final' | 'custom' | null
}

export interface ContractSummary {
  id: number
  title: string
  acknowledgedAt: string | null
  acknowledgementLegalName?: string | null
}

export interface ClientPortalData {
  project: Project
  vendorBusinessName: string
  vendorLogoUrl: string | null
  vendorTagline: string | null
  primaryColor: string
  paymentOptions: ClientPaymentOptions
  paymentSettings: ProjectPaymentSettings
  paymentSummary: ProjectPaymentSummary
  milestones: Milestone[]
  invoices: Invoice[]
  contracts: ContractSummary[]
}

export type PortalTab = 'home' | 'documents' | 'payments'

export interface NextAction {
  label: string
  description: string
  tab: PortalTab
}
