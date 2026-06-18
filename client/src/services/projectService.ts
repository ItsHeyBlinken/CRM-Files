import api from './api'
import type { ClientPortalData, Project } from '../types/portal'

export async function fetchVendorProjects(): Promise<Project[]> {
  const response = await api.get('/vendor/projects')
  return response.data.projects
}

export interface CreateProjectInput {
  title: string
  description?: string
  weddingDate?: string
  location?: string
  coupleDisplayName?: string
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
  email: string
): Promise<InviteResult> {
  const response = await api.post(`/vendor/projects/${projectId}/invite`, { email })
  return response.data.invite
}

export async function fetchClientPortal(): Promise<ClientPortalData> {
  const response = await api.get('/portal/project')
  return response.data
}
