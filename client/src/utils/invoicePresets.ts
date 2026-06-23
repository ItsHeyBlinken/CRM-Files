import type { Invoice, ProjectPaymentSettings, VendorProjectDetail } from '../types/portal'

export const DEFAULT_DEPOSIT_PERCENT = 25

function clampCurrency(amount: number): number {
  return Math.max(0, Number(amount.toFixed(2)))
}

export function getDepositAmount(settings: ProjectPaymentSettings): number | null {
  if (settings.projectTotal == null) {
    return null
  }

  if (settings.depositType == null || settings.depositValue == null) {
    return null
  }

  if (settings.depositType === 'fixed') {
    return clampCurrency(settings.depositValue)
  }

  return clampCurrency(settings.projectTotal * (settings.depositValue / 100))
}

function shiftDays(date: string, daysBefore: number | null): string {
  if (!date || daysBefore == null) return ''
  const target = new Date(`${date}T12:00:00`)
  target.setDate(target.getDate() - daysBefore)
  return target.toISOString().slice(0, 10)
}

export interface InvoicePresetInput {
  title: string
  amount: number
  description: string
  dueDate?: string
  invoiceKind: Invoice['invoiceKind']
  isDateHoldingDeposit: boolean
}

export function buildInvoicePresetInput(
  kind: Invoice['invoiceKind'],
  detail: Pick<VendorProjectDetail, 'project' | 'paymentSettings' | 'paymentSummary' | 'invoices'>
): InvoicePresetInput | null {
  const { project, paymentSettings, paymentSummary, invoices } = detail
  const projectTotal = paymentSettings.projectTotal ?? 0
  const depositAmount = getDepositAmount(paymentSettings)
  const paidTotal = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const totalAlreadyCreated = invoices
    .filter((invoice) => invoice.status !== 'cancelled')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const remainingByPaid = clampCurrency(projectTotal - paidTotal)
  const remainingByCreated = clampCurrency(projectTotal - totalAlreadyCreated)

  switch (kind) {
    case 'deposit': {
      const amount = depositAmount ?? 0
      if (amount <= 0) return null
      return {
        title: 'Deposit to hold your date',
        amount,
        description: 'Deposit due to hold the event date.',
        invoiceKind: 'deposit',
        isDateHoldingDeposit: true,
      }
    }
    case 'payment': {
      const amount = remainingByCreated
      if (amount <= 0) return null
      return {
        title: 'Payment',
        amount,
        description: 'Scheduled payment toward your event balance.',
        dueDate: shiftDays(
          project.eventDate ?? '',
          paymentSettings.secondPaymentDueDaysBeforeEvent
        ),
        invoiceKind: 'payment',
        isDateHoldingDeposit: false,
      }
    }
    case 'final': {
      const amount =
        paymentSettings.paymentPlanType === 'pay_in_full' ? projectTotal : remainingByPaid
      if (amount <= 0) return null
      return {
        title: 'Final payment',
        amount,
        description: 'Final balance due before the event.',
        dueDate: shiftDays(
          project.eventDate ?? '',
          paymentSettings.finalPaymentDueDaysBeforeEvent
        ),
        invoiceKind: 'final',
        isDateHoldingDeposit: false,
      }
    }
    case 'custom': {
      const amount = remainingByCreated || paymentSummary.amountOutstanding
      if (amount <= 0) return null
      return {
        title: `${project.title} invoice`,
        amount,
        description: '',
        invoiceKind: 'custom',
        isDateHoldingDeposit: false,
      }
    }
    default: {
      const exhaustiveCheck: never = kind
      return exhaustiveCheck
    }
  }
}
