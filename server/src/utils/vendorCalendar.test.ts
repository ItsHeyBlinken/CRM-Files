import {
  buildVendorCalendarSnapshot,
  isDateOpen,
  isScheduledProject,
  isTentativeQuote,
} from './vendorCalendar'

describe('vendorCalendar', () => {
  test('includes non-cancelled projects with event dates', () => {
    const snapshot = buildVendorCalendarSnapshot({
      projects: [
        {
          id: 1,
          title: 'Miller Gala',
          eventDate: '2026-09-12',
          status: 'booked',
          clientDisplayName: 'Miller',
          location: 'Chicago',
        },
      ],
      quotes: [],
    })

    expect(snapshot.events).toHaveLength(1)
    expect(snapshot.events[0]?.kind).toBe('project')
    expect(snapshot.busyDates).toEqual(['2026-09-12'])
  })

  test('excludes cancelled projects so the date stays open', () => {
    const snapshot = buildVendorCalendarSnapshot({
      projects: [
        {
          id: 2,
          title: 'Cancelled Event',
          eventDate: '2026-10-01',
          status: 'cancelled',
          clientDisplayName: null,
          location: null,
        },
      ],
      quotes: [],
    })

    expect(snapshot.events).toHaveLength(0)
    expect(snapshot.busyDates).toEqual([])
    expect(isDateOpen('2026-10-01', snapshot.busyDates)).toBe(true)
  })

  test('includes sent and accepted quotes as tentative holds', () => {
    const snapshot = buildVendorCalendarSnapshot({
      projects: [],
      quotes: [
        {
          id: 10,
          title: 'Pending Quote',
          eventDate: '2026-11-05',
          status: 'sent',
          clientName: 'Lee',
          location: null,
        },
        {
          id: 11,
          title: 'Accepted Quote',
          eventDate: '2026-11-20',
          status: 'accepted',
          clientName: 'Pat',
          location: null,
        },
      ],
    })

    expect(snapshot.events.map((event) => event.kind)).toEqual(['quote_tentative', 'quote_tentative'])
    expect(snapshot.busyDates).toEqual(['2026-11-05', '2026-11-20'])
  })

  test('excludes draft, converted, and declined quotes', () => {
    const snapshot = buildVendorCalendarSnapshot({
      projects: [],
      quotes: [
        {
          id: 12,
          title: 'Draft',
          eventDate: '2026-12-01',
          status: 'draft',
          clientName: null,
          location: null,
        },
        {
          id: 13,
          title: 'Converted',
          eventDate: '2026-12-02',
          status: 'converted',
          clientName: null,
          location: null,
        },
        {
          id: 14,
          title: 'Declined',
          eventDate: '2026-12-03',
          status: 'declined',
          clientName: null,
          location: null,
        },
      ],
    })

    expect(snapshot.events).toHaveLength(0)
    expect(snapshot.busyDates).toEqual([])
  })

  test('deduplicates busy dates when multiple events share a day', () => {
    const snapshot = buildVendorCalendarSnapshot({
      projects: [
        {
          id: 3,
          title: 'Morning Event',
          eventDate: '2026-08-15',
          status: 'in_progress',
          clientDisplayName: null,
          location: null,
        },
      ],
      quotes: [
        {
          id: 15,
          title: 'Evening Quote',
          eventDate: '2026-08-15',
          status: 'sent',
          clientName: null,
          location: null,
        },
      ],
    })

    expect(snapshot.events).toHaveLength(2)
    expect(snapshot.busyDates).toEqual(['2026-08-15'])
    expect(isDateOpen('2026-08-15', snapshot.busyDates)).toBe(false)
  })

  test('status helpers match calendar rules', () => {
    expect(isScheduledProject('cancelled')).toBe(false)
    expect(isScheduledProject('booked')).toBe(true)
    expect(isTentativeQuote('sent')).toBe(true)
    expect(isTentativeQuote('converted')).toBe(false)
  })
})
