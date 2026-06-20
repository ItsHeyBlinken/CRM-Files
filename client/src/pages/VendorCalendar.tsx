import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, momentLocalizer, type Event } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../components/vendor/vendorCalendar.css'
import { useAuth } from '../contexts/AuthContext'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import { fetchVendorCalendar } from '../services/calendarService'
import type { VendorCalendarEvent } from '../types/calendar'
import { formatCalendarDate, parseDateKey } from '../utils/calendarHelpers'

const localizer = momentLocalizer(moment)

interface CalendarDisplayEvent extends Event {
  resource: VendorCalendarEvent
}

function eventKindLabel(kind: VendorCalendarEvent['kind']): string {
  switch (kind) {
    case 'project':
      return 'Booked'
    case 'quote_tentative':
      return 'Tentative quote'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

const VendorCalendar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<VendorCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCalendar = useCallback(async () => {
    try {
      setError('')
      const snapshot = await fetchVendorCalendar()
      setEvents(snapshot.events)
    } catch {
      setError('Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCalendar()
  }, [loadCalendar])

  const calendarEvents = useMemo<CalendarDisplayEvent[]>(
    () =>
      events.map((event) => {
        const start = parseDateKey(event.eventDate)
        return {
          title: event.title,
          start,
          end: start,
          allDay: true,
          resource: event,
        }
      }),
    [events]
  )

  const upcomingEvents = useMemo(() => {
    const todayKey = moment().format('YYYY-MM-DD')
    return events.filter((event) => event.eventDate >= todayKey).slice(0, 8)
  }, [events])

  const handleSelectEvent = (event: CalendarDisplayEvent) => {
    navigate(event.resource.linkPath)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorDashboardHeader
        active="calendar"
        userEmail={user?.email}
        onLogout={() => logout()}
      />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Calendar</h2>
          <p className="text-sm text-gray-600">
            See booked events and tentative quote holds. Cancelled projects free up their dates
            automatically.
          </p>
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <section className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded-sm vendor-calendar-event-project border" />
              Booked project
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded-sm vendor-calendar-event-tentative border" />
              Tentative quote
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading calendar...</p>
          ) : (
            <div className="vendor-big-calendar h-[560px]">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                views={['month', 'agenda']}
                defaultView="month"
                popup
                onSelectEvent={handleSelectEvent}
                eventPropGetter={(event) => {
                  const kind = (event as CalendarDisplayEvent).resource.kind
                  return {
                    className:
                      kind === 'quote_tentative'
                        ? 'vendor-calendar-event-tentative'
                        : 'vendor-calendar-event-project',
                  }
                }}
              />
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Upcoming</h3>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading events...</p>
          ) : upcomingEvents.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No upcoming events yet. Booked projects and sent quotes with event dates appear here.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    to={event.linkPath}
                    className="block px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatCalendarDate(event.eventDate)}
                          {event.clientName ? ` · ${event.clientName}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-indigo-600 self-start sm:self-center">
                        {eventKindLabel(event.kind)} →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default VendorCalendar
