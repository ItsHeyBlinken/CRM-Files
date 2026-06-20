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
  contracts: Array<{
    id: number
    title: string
    fileName: string
    acknowledgedAt: string | null
    acknowledgementLegalName?: string | null
    createdAt: string
  }>
  milestones: Milestone[]
  invoices: Invoice[]
  deliverables: Array<{
    id: number
    title: string
    fileName: string
    fileSizeBytes: number | null
    clientVisible: boolean
    createdAt: string
  }>
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

export interface ContractSummary {
  id: number
  title: string
  acknowledgedAt: string | null
  acknowledgementLegalName?: string | null
}

export interface DeliverableSummary {
  id: number
  title: string
  fileName: string
  fileSizeBytes: number | null
}

export interface ClientPortalData {
  project: Project
  vendorBusinessName: string
  vendorLogoUrl: string | null
  primaryColor: string
  paymentOptions: ClientPaymentOptions
  milestones: Milestone[]
  invoices: Invoice[]
  contracts: ContractSummary[]
  deliverables: DeliverableSummary[]
}

export type PortalTab = 'home' | 'documents' | 'payments' | 'files'

export interface NextAction {
  label: string
  description: string
  tab: PortalTab
}
