/** Product guide content — event-neutral; wedding-type vendors, any event. */

export const VENDOR_GUIDE_STORAGE_KEY = 'smoothgig_vendor_guide_completed'

export interface GuideWorkflowStep {
  step: number
  title: string
  description: string
  to: string
  cta: string
}

export interface GuideFeature {
  title: string
  description: string
  to: string
  label: string
}

export const GUIDE_WORKFLOW_STEPS: GuideWorkflowStep[] = [
  {
    step: 1,
    title: 'Capture inquiries',
    description:
      'Log people who reach out — name, email, event date, budget. Track status from New through Booked or Lost.',
    to: '/dashboard/inquiries',
    cta: 'Open Inquiries',
  },
  {
    step: 2,
    title: 'Send a quote',
    description:
      'Create a quote from an inquiry or from scratch. Use package templates, set your prices, attach a contract PDF, and send a link.',
    to: '/dashboard/quotes',
    cta: 'Open Quotes',
  },
  {
    step: 3,
    title: 'Client accepts',
    description:
      'Your client opens the quote link — no account needed. They accept (and sign the contract if you attached one).',
    to: '/dashboard/quotes',
    cta: 'View quotes',
  },
  {
    step: 4,
    title: 'Auto-setup on accept',
    description:
      'SmoothGig creates the project, deposit invoice, portal invite, and timeline. You get notified when it\'s ready.',
    to: '/dashboard',
    cta: 'Go to Home',
  },
  {
    step: 5,
    title: 'Client portal',
    description:
      'Clients see what\'s next: sign, pay deposit, view documents. You brand the portal in Settings — colors and logo only there.',
    to: '/dashboard/settings',
    cta: 'Portal branding',
  },
  {
    step: 6,
    title: 'Deliver the event',
    description:
      'Manage invoices, milestones, and project status from the project page. Calendar shows booked dates and tentative quotes.',
    to: '/dashboard/calendar',
    cta: 'Open Calendar',
  },
]

export const GUIDE_FEATURES: GuideFeature[] = [
  {
    title: 'Inquiries',
    description: 'Lightweight inbox — not a CRM. Filter Active, Booked, or Lost.',
    to: '/dashboard/inquiries',
    label: 'Inquiries',
  },
  {
    title: 'Quote packages',
    description: 'Reusable line-item sets by vendor category. Edit templates in Settings.',
    to: '/dashboard/settings',
    label: 'Settings → Packages',
  },
  {
    title: 'Payments',
    description: 'Stripe Payment Link + Venmo, Zelle, etc. Clients pay; you confirm receipt.',
    to: '/dashboard/payments',
    label: 'Payment settings',
  },
  {
    title: 'Contracts',
    description: 'Attach a PDF to quotes. Clients review and e-sign on the quote link.',
    to: '/dashboard/quotes',
    label: 'Quotes',
  },
  {
    title: 'Notifications',
    description: 'Bell in the header for quote responses, invites, and payment claims.',
    to: '/dashboard',
    label: 'Home',
  },
  {
    title: 'Calendar',
    description: 'Booked projects and tentative quote dates in one view.',
    to: '/dashboard/calendar',
    label: 'Calendar',
  },
]

export const GUIDE_TIPS: string[] = [
  'Budget on an inquiry is reference only — set real prices on the quote.',
  'Mark an inquiry Lost to archive it; linked open quotes close automatically.',
  'Same client can inquire again later — each inquiry is a new row.',
  'Client portal uses your branding from Settings; the vendor dashboard uses SmoothGig chrome.',
]
