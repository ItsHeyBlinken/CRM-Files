import type { ClientPortalData, NextAction, PortalTab, ProjectStatus } from '../types/portal'

export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'inquiry':
      return "We're getting things started"
    case 'booked':
      return "You're booked!"
    case 'in_progress':
      return 'Your event is in progress'
    case 'delivered':
      return 'Deliverables are ready'
    case 'complete':
      return 'All wrapped up'
    case 'cancelled':
      return 'Project cancelled'
    default:
      return 'In progress'
  }
}

export function formatEventDate(date: string | null): string {
  if (!date) return 'Date to be confirmed'
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}

export function getInvoiceDisplayLabel(invoice: {
  title: string
  invoiceKind: 'deposit' | 'payment' | 'final' | 'custom'
  isDateHoldingDeposit: boolean
}): string {
  if (invoice.invoiceKind === 'deposit' && invoice.isDateHoldingDeposit) {
    return 'Deposit to hold your date'
  }

  switch (invoice.invoiceKind) {
    case 'deposit':
      return 'Deposit'
    case 'payment':
      return 'Payment'
    case 'final':
      return 'Final payment'
    case 'custom':
      return invoice.title
    default: {
      const exhaustiveCheck: never = invoice.invoiceKind
      return exhaustiveCheck
    }
  }
}

export function getNextAction(data: ClientPortalData): NextAction | null {
  const unackedContract = data.contracts.find((c) => !c.acknowledgedAt)
  if (unackedContract) {
    return {
      label: 'Sign your contract',
      description: `${unackedContract.title} is ready for your electronic signature.`,
      tab: 'documents',
    }
  }

  const openInvoice = data.invoices.find(
    (inv) => inv.status === 'sent' || inv.status === 'overdue'
  )
  if (openInvoice) {
    const canPayWithCard = data.paymentOptions.stripeEnabled
    const isDeposit = openInvoice.invoiceKind === 'deposit'
    return {
      label: canPayWithCard
        ? isDeposit
          ? 'Pay your deposit'
          : 'Pay your invoice'
        : isDeposit
          ? 'View your deposit'
          : 'View your invoice',
      description: `${openInvoice.title} — ${formatCurrency(openInvoice.amount, openInvoice.currency)}`,
      tab: 'payments',
    }
  }

  const upcomingMilestone = data.milestones.find((m) => m.status !== 'complete')
  if (upcomingMilestone) {
    return {
      label: "See what's next",
      description: upcomingMilestone.title,
      tab: 'home',
    }
  }

  return null
}

export function getInvoiceStatusLabel(status: string): string {
  switch (status) {
    case 'sent':
      return 'Due'
    case 'paid':
      return 'Paid'
    case 'overdue':
      return 'Overdue'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function portalTabLabel(tab: PortalTab): string {
  switch (tab) {
    case 'home':
      return 'Home'
    case 'documents':
      return 'Documents'
    case 'payments':
      return 'Payments'
    case 'files':
      return 'Files'
    default: {
      const _exhaustive: never = tab
      return _exhaustive
    }
  }
}
