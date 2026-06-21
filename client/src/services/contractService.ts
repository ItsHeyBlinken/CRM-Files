import api from './api'

export interface VendorContract {
  id: number
  title: string
  fileName: string
  fileAvailable: boolean
  acknowledgedAt: string | null
  acknowledgementLegalName?: string | null
  createdAt: string
}

export interface ContractSigningContext {
  contractId: number
  title: string
  pdfHash: string
  suggestedLegalName: string
  accountLegalName: string
  minViewSeconds: number
  consentVersion: string
  consentText: string
  alreadyAcknowledged: boolean
}

export interface AcknowledgeContractInput {
  legalName: string
  pdfHash: string
  viewDurationSeconds: number
  scrolledToEnd: boolean
  consentAccepted: boolean
  confirmLegalName?: boolean
}

export async function fetchProjectContracts(projectId: number): Promise<VendorContract[]> {
  const response = await api.get(`/vendor/projects/${projectId}/contracts`)
  return response.data.contracts
}

export async function uploadProjectContract(
  projectId: number,
  title: string,
  file: File
): Promise<VendorContract> {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('file', file)

  const response = await api.post(`/vendor/projects/${projectId}/contracts`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.contract
}

export async function fetchContractSigningContext(
  contractId: number
): Promise<ContractSigningContext> {
  const response = await api.get(`/portal/contracts/${contractId}/signing-context`)
  return response.data.context
}

export function getPortalContractFileUrl(contractId: number): string {
  const apiBaseURL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'
  return `${apiBaseURL}/portal/contracts/${contractId}/file`
}

export async function fetchContractPdfBlob(contractId: number): Promise<Blob> {
  const response = await api.get(`/portal/contracts/${contractId}/file`, {
    responseType: 'blob',
  })
  return response.data
}

export async function acknowledgeContract(
  contractId: number,
  input: AcknowledgeContractInput
): Promise<VendorContract> {
  const response = await api.post(`/portal/contracts/${contractId}/acknowledge`, input)
  return response.data.contract
}
