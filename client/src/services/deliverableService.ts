import api from './api'

export interface VendorDeliverable {
  id: number
  title: string
  fileName: string
  fileSizeBytes: number | null
  clientVisible: boolean
  createdAt: string
}

export async function fetchProjectDeliverables(projectId: number): Promise<VendorDeliverable[]> {
  const response = await api.get(`/vendor/projects/${projectId}/deliverables`)
  return response.data.deliverables
}

export async function uploadProjectDeliverable(
  projectId: number,
  title: string,
  file: File,
  description?: string
): Promise<VendorDeliverable> {
  const formData = new FormData()
  formData.append('title', title)
  if (description?.trim()) {
    formData.append('description', description.trim())
  }
  formData.append('file', file)

  const response = await api.post(`/vendor/projects/${projectId}/deliverables`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.deliverable
}

export async function downloadDeliverableBlob(deliverableId: number): Promise<{
  blob: Blob
  fileName: string
}> {
  const response = await api.get(`/portal/deliverables/${deliverableId}/file`, {
    responseType: 'blob',
  })

  const disposition = response.headers['content-disposition'] as string | undefined
  const fileNameMatch = disposition?.match(/filename="([^"]+)"/)
  const fileName = fileNameMatch?.[1] ?? 'download'

  return { blob: response.data, fileName }
}
