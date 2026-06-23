/** Platform product name (not the vendor's business name). */
export const APP_NAME = 'SmoothGig'

/** Visual wordmark split — use when a text wordmark is needed (e.g. vendor shell fallback). */
export const APP_NAME_PARTS = ['Smooth', 'Gig'] as const

export const APP_TAGLINE = 'Book gigs. Grow business. Deliver smoothly.'

export const APP_DOMAIN = 'smoothgig.com'

/** Platform logo — served from `client/public/smoothgig-logo.png` */
export const PLATFORM_LOGO_SRC = '/smoothgig-logo.png'
export const PLATFORM_LOGO_ALT = 'SmoothGig — book gigs, grow business, deliver smoothly'

/** Platform marketing palette (matches logo) */
export const BRAND_COLORS = {
  navy: '#0B132B',
  cyan: '#00D2FF',
  blue: '#0052D4',
  purple: '#6E00FF',
} as const
