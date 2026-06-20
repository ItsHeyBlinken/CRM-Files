export type VendorCalendarEventKind = 'project' | 'quote_tentative'

export interface VendorCalendarEvent {
  id: string
  kind: VendorCalendarEventKind
  sourceId: number
  title: string
  eventDate: string
  status: string
  clientName: string | null
  location: string | null
  linkPath: string
}

export interface VendorCalendarSnapshot {
  events: VendorCalendarEvent[]
  busyDates: string[]
}
