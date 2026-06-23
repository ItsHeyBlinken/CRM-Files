const STRIPE_HOST_SUFFIX = 'stripe.com'

export function normalizeStripePaymentLink(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (parsed.protocol !== 'https:') {
      return null
    }
    if (!parsed.hostname.endsWith(STRIPE_HOST_SUFFIX)) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export function parseStripePaymentLinkInput(
  value: string | null | undefined
): { ok: true; link: string | null } | { ok: false } {
  if (value === undefined) {
    return { ok: true, link: null }
  }

  const trimmed = value?.trim() ?? ''
  if (!trimmed) {
    return { ok: true, link: null }
  }

  const link = normalizeStripePaymentLink(trimmed)
  if (!link) {
    return { ok: false }
  }

  return { ok: true, link }
}
