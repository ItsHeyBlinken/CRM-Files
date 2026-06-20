export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00`)
}

export function formatCalendarDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Display a YYYY-MM-DD date key in US form: MM-DD-YYYY */
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

  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const year = parsed.getFullYear()
  return `${month}-${day}-${year}`
}

export function isBusyDate(dateKey: string, busyDates: readonly string[]): boolean {
  return busyDates.includes(dateKey)
}
