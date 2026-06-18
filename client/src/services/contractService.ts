import api from './api'

export interface VendorContract {
  id: number
  title: string
  fileName: string
  acknowledgedAt: string | null
  createdAt: string
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

export async function fetchContractPdfBlob(contractId: number): Promise<Blob> {
  const response = await api.get(`/portal/contracts/${contractId}/file`, {
    responseType: 'blob',
  })
  return response.data
}

export async function acknowledgeContract(contractId: number): Promise<VendorContract> {
  const response = await api.post(`/portal/contracts/${contractId}/acknowledge`)
  return response.data.contract
}
