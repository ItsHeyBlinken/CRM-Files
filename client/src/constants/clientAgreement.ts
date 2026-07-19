export const CLIENT_AGREEMENT_HEADLINE =
  'Someone is not a client until all three parts of the agreement are complete.'

export const CLIENT_AGREEMENT_REQUIREMENTS = [
  'Accept the quote',
  'Sign the contract (or accept terms and conditions)',
  'Pay their deposit',
] as const

export const CLIENT_AGREEMENT_FOOTNOTE =
  'All three together establish the client relationship. Accepting a quote alone does not make someone a booked client.'

export const QUOTE_CONTRACT_VIEW_ONLY_NOTE =
  'The contract is view-only until you accept the quote. Signing unlocks after you accept.'

export const QUOTE_ACCEPTED_NEXT_STEPS_HEADLINE = 'Quote accepted — here’s what happens next'

export const QUOTE_ACCEPTED_NEXT_STEPS = [
  'Sign the contract below when you’re ready.',
  'After you sign, your project starts automatically — deposit invoice and portal invite are prepared for you.',
  'Check your email for the portal invite, then pay your deposit there.',
  'You’re not fully booked until your deposit is paid.',
] as const

export const CONTRACT_SIGNED_NEXT_STEPS_HEADLINE = 'You’re on your way — project started'

export const CONTRACT_SIGNED_NEXT_STEPS = [
  'Your project is set up and a deposit invoice is ready.',
  'Check your email for a client portal invite (or ask your vendor to resend the link).',
  'Open the portal to pay your deposit and see what’s next.',
  'You’re not fully booked until your deposit is paid.',
] as const

export const QUOTE_ACCEPTED_NO_CONTRACT_NEXT_STEPS = [
  'Your project is set up and a deposit invoice is ready.',
  'Check your email for a client portal invite.',
  'Open the portal to pay your deposit and see what’s next.',
  'You’re not fully booked until your deposit is paid.',
] as const

export const QUOTE_AUTO_CONVERTED_HEADLINE = 'Project started — check your email'

export const QUOTE_AUTO_CONVERTED_STEPS = [
  'Your vendor portal invite and deposit invoice are ready.',
  'Open the invite link in your email to create your account.',
  'Pay your deposit in the portal to finish booking.',
] as const
