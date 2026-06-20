import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import './vendorCalendar.css'
import { fetchVendorCalendar } from '../../services/calendarService'
import type { VendorCalendarSnapshot } from '../../types/calendar'
import { isBusyDate, parseDateKey, toDateKey } from '../../utils/calendarHelpers'

interface VendorEventDatePickerProps {
  id?: string
  value: string
  onChange: (eventDate: string) => void
}

const VendorEventDatePicker: React.FC<VendorEventDatePickerProps> = ({ id, value, onChange }) => {
  const [snapshot, setSnapshot] = useState<VendorCalendarSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCalendar() {
      try {
        setLoadError('')
        const calendar = await fetchVendorCalendar()
        if (!cancelled) {
          setSnapshot(calendar)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Could not load your schedule. You can still pick a date manually.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCalendar()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedDate = value ? parseDateKey(value) : null
  const busyDates = snapshot?.busyDates ?? []
  const showBusyWarning = value ? isBusyDate(value, busyDates) : false

  const tileClassName = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== 'month' || !snapshot) {
        return null
      }
      const dateKey = toDateKey(date)
      return isBusyDate(dateKey, snapshot.busyDates) ? 'vendor-date-busy' : null
    },
    [snapshot]
  )

  const handleCalendarChange = (nextValue: unknown) => {
    if (!(nextValue instanceof Date)) {
      return
    }
    onChange(toDateKey(nextValue))
  }

  const handleManualChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const legend = useMemo(
    () => (
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-gray-200 bg-white" />
          Open day
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-amber-300 bg-amber-100" />
          Scheduled or tentative
        </span>
      </div>
    ),
    []
  )

  return (
    <div className="space-y-3">
      <label htmlFor={id} className="block text-xs font-medium text-gray-700">
        Event date (optional)
      </label>

      {loading ? (
        <p className="text-sm text-gray-500">Loading your schedule...</p>
      ) : (
        <>
          <div className="rounded-md border border-gray-200 bg-white p-3 inline-block">
            <Calendar
              onChange={handleCalendarChange}
              value={selectedDate}
              tileClassName={tileClassName}
              minDetail="month"
            />
          </div>
          {legend}
        </>
      )}

      <input
        id={id}
        type="date"
        value={value}
        onChange={handleManualChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />

      {loadError && <p className="text-xs text-amber-700">{loadError}</p>}

      {showBusyWarning && (
        <p className="text-xs text-amber-700">
          This date already has a scheduled event or tentative quote. You can still use it, but
          double-check your availability.
        </p>
      )}
    </div>
  )
}

export default VendorEventDatePicker
