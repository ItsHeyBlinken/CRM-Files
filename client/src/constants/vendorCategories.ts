/**
 * Vendor trade categories for onboarding + package starters.
 * Wedding-type vendors first; copy stays event-neutral (not wedding-only).
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

export const VENDOR_CATEGORY_LABELS: Record<VendorCategoryId, string> = {
  photography: 'Photography',
  videography: 'Videography',
  dj_entertainment: 'DJ / Entertainment',
  florals: 'Florals',
  catering: 'Catering',
  planning: 'Planning / Coordination',
  other: 'Other',
}

export interface PackageStarterTemplate {
  id: string
  categoryId: VendorCategoryId
  name: string
  description: string
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
}

/** Placeholder prices are $0 — vendor fills in their rates. */
export const PACKAGE_STARTER_TEMPLATES: PackageStarterTemplate[] = [
  // Photography
  {
    id: 'photo-essential',
    categoryId: 'photography',
    name: 'Essential Coverage',
    description: 'Core photo coverage for the event day',
    lineItems: [
      { description: 'Event-day photography coverage', quantity: 1, unitPrice: 0 },
      { description: 'Online gallery delivery', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'photo-full',
    categoryId: 'photography',
    name: 'Full Day Collection',
    description: 'Extended coverage with second shooter',
    lineItems: [
      { description: 'Full-day photography coverage', quantity: 1, unitPrice: 0 },
      { description: 'Second photographer', quantity: 1, unitPrice: 0 },
      { description: 'Online gallery delivery', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'photo-session',
    categoryId: 'photography',
    name: 'Portrait / Engagement Session',
    description: 'Standalone session before or after the event',
    lineItems: [
      { description: 'Portrait session (up to 1 hour)', quantity: 1, unitPrice: 0 },
      { description: 'Edited digital images', quantity: 1, unitPrice: 0 },
    ],
  },
  // Videography
  {
    id: 'video-highlight',
    categoryId: 'videography',
    name: 'Highlight Film',
    description: 'Short highlight film of the event',
    lineItems: [
      { description: 'Event-day video coverage', quantity: 1, unitPrice: 0 },
      { description: 'Highlight film edit', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'video-full',
    categoryId: 'videography',
    name: 'Full Documentary',
    description: 'Extended documentary-style coverage',
    lineItems: [
      { description: 'Full-day video coverage', quantity: 1, unitPrice: 0 },
      { description: 'Feature film edit', quantity: 1, unitPrice: 0 },
      { description: 'Raw footage delivery (optional)', quantity: 1, unitPrice: 0 },
    ],
  },
  // DJ
  {
    id: 'dj-reception',
    categoryId: 'dj_entertainment',
    name: 'Reception Entertainment',
    description: 'Music and MC for the reception',
    lineItems: [
      { description: 'DJ / entertainment for reception', quantity: 1, unitPrice: 0 },
      { description: 'Basic lighting package', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'dj-full',
    categoryId: 'dj_entertainment',
    name: 'Full Event Entertainment',
    description: 'Ceremony through reception',
    lineItems: [
      { description: 'Ceremony + reception entertainment', quantity: 1, unitPrice: 0 },
      { description: 'MC services', quantity: 1, unitPrice: 0 },
      { description: 'Uplighting package', quantity: 1, unitPrice: 0 },
    ],
  },
  // Florals
  {
    id: 'floral-essentials',
    categoryId: 'florals',
    name: 'Floral Essentials',
    description: 'Core personal flowers and accents',
    lineItems: [
      { description: 'Personal flowers (bouquets / boutonnieres)', quantity: 1, unitPrice: 0 },
      { description: 'Ceremony accents', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'floral-full',
    categoryId: 'florals',
    name: 'Full Floral Design',
    description: 'Personal flowers plus centerpieces',
    lineItems: [
      { description: 'Personal flowers', quantity: 1, unitPrice: 0 },
      { description: 'Ceremony florals', quantity: 1, unitPrice: 0 },
      { description: 'Reception centerpieces', quantity: 1, unitPrice: 0 },
    ],
  },
  // Catering
  {
    id: 'catering-plated',
    categoryId: 'catering',
    name: 'Plated Dinner Service',
    description: 'Plated meal for guests',
    lineItems: [
      { description: 'Plated dinner (per guest)', quantity: 1, unitPrice: 0 },
      { description: 'Service staff', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'catering-stations',
    categoryId: 'catering',
    name: 'Stations / Buffet',
    description: 'Stations or buffet-style service',
    lineItems: [
      { description: 'Buffet or stations package (per guest)', quantity: 1, unitPrice: 0 },
      { description: 'Setup and service', quantity: 1, unitPrice: 0 },
    ],
  },
  // Planning
  {
    id: 'planning-day-of',
    categoryId: 'planning',
    name: 'Day-of Coordination',
    description: 'On-site coordination for the event day',
    lineItems: [
      { description: 'Day-of coordination', quantity: 1, unitPrice: 0 },
      { description: 'Vendor timeline management', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'planning-partial',
    categoryId: 'planning',
    name: 'Partial Planning',
    description: 'Planning support leading up to the event',
    lineItems: [
      { description: 'Partial planning package', quantity: 1, unitPrice: 0 },
      { description: 'Vendor recommendations and coordination', quantity: 1, unitPrice: 0 },
      { description: 'Day-of coordination', quantity: 1, unitPrice: 0 },
    ],
  },
  // Other / general
  {
    id: 'other-standard',
    categoryId: 'other',
    name: 'Standard Package',
    description: 'Customize for your service',
    lineItems: [
      { description: 'Primary service', quantity: 1, unitPrice: 0 },
      { description: 'Add-on or delivery', quantity: 1, unitPrice: 0 },
    ],
  },
  {
    id: 'other-premium',
    categoryId: 'other',
    name: 'Premium Package',
    description: 'Expanded service offering',
    lineItems: [
      { description: 'Primary service (expanded)', quantity: 1, unitPrice: 0 },
      { description: 'Premium add-on', quantity: 1, unitPrice: 0 },
      { description: 'Consultation / planning call', quantity: 1, unitPrice: 0 },
    ],
  },
]

export function isVendorCategoryId(value: string | null | undefined): value is VendorCategoryId {
  return Boolean(value && (VENDOR_CATEGORY_IDS as readonly string[]).includes(value))
}

/** Map stored service_type to a known category (legacy free-text → other). */
export function normalizeVendorCategory(
  serviceType: string | null | undefined
): VendorCategoryId {
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

export function templatesForCategory(
  categoryId: VendorCategoryId,
  options?: { includeOtherCategories?: boolean }
): PackageStarterTemplate[] {
  if (options?.includeOtherCategories) {
    return PACKAGE_STARTER_TEMPLATES
  }
  const primary = PACKAGE_STARTER_TEMPLATES.filter((t) => t.categoryId === categoryId)
  return primary
}
