import api from './api'
import type { VendorNotification, VendorProfile } from '../types/vendorExtras'

export async function fetchVendorNotifications(): Promise<{
  notifications: VendorNotification[]
  unreadCount: number
}> {
  const response = await api.get('/vendor/notifications')
  return response.data
}

export async function markNotificationRead(
  notificationId: number
): Promise<{ unreadCount: number }> {
  const response = await api.patch(`/vendor/notifications/${notificationId}/read`)
  return { unreadCount: response.data.unreadCount }
}

export async function markAllNotificationsRead(): Promise<{ unreadCount: number }> {
  const response = await api.patch('/vendor/notifications/read-all')
  return { unreadCount: response.data.unreadCount }
}

export async function fetchVendorProfile(): Promise<VendorProfile> {
  const response = await api.get('/vendor/profile')
  return response.data.profile
}

export async function updateVendorProfile(
  input: Partial<
    Pick<
      VendorProfile,
      | 'businessName'
      | 'serviceType'
      | 'tagline'
      | 'primaryColor'
      | 'secondaryColor'
      | 'website'
      | 'businessPhone'
      | 'businessEmail'
    >
  >
): Promise<VendorProfile> {
  const response = await api.put('/vendor/profile', input)
  return response.data.profile
}

export async function uploadVendorLogo(file: File): Promise<VendorProfile> {
  const formData = new FormData()
  formData.append('logo', file)
  const response = await api.post('/vendor/profile/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.profile
}

export async function sendQuoteEmail(quoteId: number): Promise<{
  sent: boolean
  skippedReason?: string
}> {
  const response = await api.post(`/vendor/quotes/${quoteId}/send-email`)
  return response.data.email
}
