import type { ClientPortalData, NextAction, PortalTab, ProjectStatus } from '../types/portal'

export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'inquiry':
      return "We're getting things started"
    case 'booked':
      return "You're booked!"
    case 'in_progress':
      return 'Your wedding is in progress'
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

export function formatWeddingDate(date: string | null): string {
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

export function getNextAction(data: ClientPortalData): NextAction | null {
  const unackedContract = data.contracts.find((c) => !c.acknowledgedAt)
  if (unackedContract) {
    return {
      label: 'Review your contract',
      description: `${unackedContract.title} is waiting for your acknowledgement.`,
      tab: 'documents',
    }
  }

  const openInvoice = data.invoices.find(
    (inv) => inv.status === 'sent' || inv.status === 'overdue'
  )
  if (openInvoice) {
    return {
      label: 'View your invoice',
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
