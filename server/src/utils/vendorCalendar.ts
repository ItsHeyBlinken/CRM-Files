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

export interface VendorCalendarProjectInput {
  id: number
  title: string
  eventDate: string | null
  status: string
  clientDisplayName: string | null
  location: string | null
}

export interface VendorCalendarQuoteInput {
  id: number
  title: string
  eventDate: string | null
  status: string
  clientName: string | null
  location: string | null
}

const TENTATIVE_QUOTE_STATUSES = ['sent', 'accepted'] as const

export function isScheduledProject(status: string): boolean {
  return status !== 'cancelled'
}

export function isTentativeQuote(status: string): boolean {
  return (TENTATIVE_QUOTE_STATUSES as readonly string[]).includes(status)
}

export function buildVendorCalendarSnapshot(input: {
  projects: VendorCalendarProjectInput[]
  quotes: VendorCalendarQuoteInput[]
}): VendorCalendarSnapshot {
  const events: VendorCalendarEvent[] = []
  const busyDateSet = new Set<string>()

  for (const project of input.projects) {
    if (!project.eventDate || !isScheduledProject(project.status)) {
      continue
    }

    busyDateSet.add(project.eventDate)
    events.push({
      id: `project-${project.id}`,
      kind: 'project',
      sourceId: project.id,
      title: project.title,
      eventDate: project.eventDate,
      status: project.status,
      clientName: project.clientDisplayName,
      location: project.location,
      linkPath: `/dashboard/projects/${project.id}`,
    })
  }

  for (const quote of input.quotes) {
    if (!quote.eventDate || !isTentativeQuote(quote.status)) {
      continue
    }

    busyDateSet.add(quote.eventDate)
    events.push({
      id: `quote-${quote.id}`,
      kind: 'quote_tentative',
      sourceId: quote.id,
      title: quote.title,
      eventDate: quote.eventDate,
      status: quote.status,
      clientName: quote.clientName,
      location: quote.location,
      linkPath: `/dashboard/quotes/${quote.id}`,
    })
  }

  events.sort((a, b) => {
    if (a.eventDate !== b.eventDate) {
      return a.eventDate.localeCompare(b.eventDate)
    }
    if (a.kind !== b.kind) {
      return a.kind === 'project' ? -1 : 1
    }
    return a.title.localeCompare(b.title)
  })

  return {
    events,
    busyDates: [...busyDateSet].sort(),
  }
}

export function isDateOpen(eventDate: string, busyDates: readonly string[]): boolean {
  return !busyDates.includes(eventDate)
}
