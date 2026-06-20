import api from './api'
import type {
  ClientPortalData,
  Project,
  ProjectPaymentSettings,
  ProjectStatus,
  VendorProjectDetail,
} from '../types/portal'

export async function fetchVendorProjects(): Promise<Project[]> {
  const response = await api.get('/vendor/projects')
  return response.data.projects
}

export async function fetchVendorProject(projectId: number): Promise<VendorProjectDetail> {
  const response = await api.get(`/vendor/projects/${projectId}`)
  return response.data.detail
}

export interface UpdateProjectInput {
  status?: ProjectStatus
  title?: string
  description?: string | null
  eventDate?: string | null
  location?: string | null
  clientDisplayName?: string | null
  clientEmail?: string | null
  internalNotes?: string | null
}

export async function updateVendorProject(
  projectId: number,
  input: UpdateProjectInput
): Promise<Project> {
  const response = await api.put(`/vendor/projects/${projectId}`, input)
  return response.data.project
}

export interface CreateProjectInput {
  title: string
  description?: string
  eventDate?: string
  location?: string
  clientDisplayName?: string
  clientEmail?: string
  status?: string
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const response = await api.post('/vendor/projects', input)
  return response.data.project
}

export interface InviteResult {
  token: string
  email: string
  expiresAt: string
  invitePath: string
}

export async function createProjectInvite(
  projectId: number,
  email: string,
  options?: { sendEmail?: boolean }
): Promise<{ invite: InviteResult; email?: { sent: boolean; skippedReason?: string } }> {
  const response = await api.post(`/vendor/projects/${projectId}/invite`, {
    email,
    sendEmail: options?.sendEmail === true,
  })
  return response.data
}

export async function fetchClientPortal(): Promise<ClientPortalData> {
  const response = await api.get('/portal/project')
  return response.data
}

export interface UpdateProjectPaymentSettingsInput {
  projectTotal?: number | null
  paymentPlanType: ProjectPaymentSettings['paymentPlanType']
  depositType?: ProjectPaymentSettings['depositType']
  depositValue?: number | null
  secondPaymentDueDaysBeforeEvent?: number | null
  finalPaymentDueDaysBeforeEvent?: number | null
}

export async function updateProjectPaymentSettings(
  projectId: number,
  input: UpdateProjectPaymentSettingsInput
): Promise<ProjectPaymentSettings> {
  const response = await api.put(`/vendor/projects/${projectId}/payment-settings`, input)
  return response.data.settings
}
