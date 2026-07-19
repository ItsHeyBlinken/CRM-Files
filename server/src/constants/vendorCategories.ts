/**
 * Vendor trade categories — keep in sync with client/src/constants/vendorCategories.ts
 */

export const VENDOR_CATEGORY_IDS = [
  'photography',
  'videography',
  'dj_entertainment',
  'florals',
  'catering',
  'planning',
  'other',
] as const

export type VendorCategoryId = (typeof VENDOR_CATEGORY_IDS)[number]

export function isVendorCategoryId(value: unknown): value is VendorCategoryId {
  return typeof value === 'string' && (VENDOR_CATEGORY_IDS as readonly string[]).includes(value)
}

export function normalizeVendorCategory(serviceType: string | null | undefined): VendorCategoryId {
  if (!serviceType?.trim()) return 'other'
  const raw = serviceType.trim().toLowerCase()
  if (isVendorCategoryId(raw)) return raw
  if (raw.includes('photo')) return 'photography'
  if (raw.includes('video')) return 'videography'
  if (raw.includes('dj') || raw.includes('entertain') || raw.includes('music')) {
    return 'dj_entertainment'
  }
  if (raw.includes('flor')) return 'florals'
  if (raw.includes('cater') || raw.includes('food')) return 'catering'
  if (raw.includes('plan') || raw.includes('coordinat')) return 'planning'
  return 'other'
}
