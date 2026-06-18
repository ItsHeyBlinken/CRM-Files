/**
 * Normalize PostgreSQL DATE / date-like values to YYYY-MM-DD for API responses and inserts.
 */
export function formatDateOnly(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null
    }
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const str = String(value).trim()
  const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(str)
  if (isoMatch) {
    return isoMatch[1] ?? null
  }

  const parsed = new Date(str)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
