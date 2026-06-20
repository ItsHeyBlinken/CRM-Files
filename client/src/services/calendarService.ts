import api from './api'
import type { VendorCalendarSnapshot } from '../types/calendar'

export async function fetchVendorCalendar(): Promise<VendorCalendarSnapshot> {
  const response = await api.get('/vendor/calendar')
  return response.data.calendar
}
