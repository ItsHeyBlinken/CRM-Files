export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00`)
}

function formatDateToUs(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}-${day}-${year}`
}

export function formatCalendarDate(dateKey: string): string {
  return formatUsDateKey(dateKey)
}

/** Display a YYYY-MM-DD date key (or ISO datetime) in US form: MM-DD-YYYY */
export function formatUsDateKey(dateKey: string | null | undefined): string {
  if (!dateKey) {
    return ''
  }

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch
    return `${month}-${day}-${year}`
  }

  const parsed = new Date(dateKey.includes('T') ? dateKey : `${dateKey}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return dateKey
  }

  return formatDateToUs(parsed)
}

/** App-wide date display: MM-DD-YYYY */
export function formatUsDate(value: string | Date | null | undefined): string {
  if (!value) {
    return ''
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return ''
    }
    return formatDateToUs(value)
  }

  return formatUsDateKey(value)
}

/** App-wide datetime display: MM-DD-YYYY, h:mm AM/PM */
export function formatUsDateTime(value: string | Date | null | undefined): string {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : ''
  }

  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${formatDateToUs(date)}, ${timePart}`
}

export function isBusyDate(dateKey: string, busyDates: readonly string[]): boolean {
  return busyDates.includes(dateKey)
}
