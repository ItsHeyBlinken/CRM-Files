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
  weddingDate: string | null
  location: string | null
  status: ProjectStatus
  coupleDisplayName: string | null
  clientEmail: string | null
}

export interface Milestone {
  id: number
  title: string
  description: string | null
  dueDate: string | null
  status: 'pending' | 'in_progress' | 'complete'
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
}

export interface ContractSummary {
  id: number
  title: string
  acknowledgedAt: string | null
}

export interface DeliverableSummary {
  id: number
  title: string
}

export interface ClientPortalData {
  project: Project
  vendorBusinessName: string
  vendorLogoUrl: string | null
  primaryColor: string
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
