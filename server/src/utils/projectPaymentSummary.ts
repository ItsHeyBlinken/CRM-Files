export type PaymentPlanType = 'pay_in_full' | 'deposit_and_balance' | 'split_payments'
export type DepositType = 'fixed' | 'percentage'
export type InvoiceKind = 'deposit' | 'payment' | 'final' | 'custom'
export type InvoiceSummaryStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type DepositStatus = 'not_applicable' | 'not_sent' | 'unpaid' | 'paid'

export interface ProjectPaymentSettingsSnapshot {
  projectTotal: number | null
  paymentPlanType: PaymentPlanType
  depositType: DepositType | null
  depositValue: number | null
  secondPaymentDueDaysBeforeEvent: number | null
  finalPaymentDueDaysBeforeEvent: number | null
}

export interface ProjectInvoiceSummarySnapshot {
  id: number
  title: string
  amount: number
  status: InvoiceSummaryStatus
  invoiceKind: InvoiceKind
}

export interface ProjectPaymentSummary {
  amountPaid: number
  amountOutstanding: number
  depositStatus: DepositStatus
  nextSuggestedInvoiceKind: InvoiceKind | null
}

interface SummarizeArgs {
  settings: ProjectPaymentSettingsSnapshot
  invoices: ProjectInvoiceSummarySnapshot[]
}

interface BuildInvoiceDefaultsArgs {
  projectTitle: string
  settings: ProjectPaymentSettingsSnapshot
  invoiceKind: InvoiceKind
  existingInvoices: ProjectInvoiceSummarySnapshot[]
}

interface InvoiceDefaults {
  title: string
  amount: number
}

function clampCurrency(amount: number): number {
  return Math.max(0, Number(amount.toFixed(2)))
}

function isOpenInvoiceStatus(status: InvoiceSummaryStatus): boolean {
  return status === 'sent' || status === 'overdue'
}

function getDepositAmount(
  settings: ProjectPaymentSettingsSnapshot
): number | null {
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

export function getNextSuggestedInvoiceKind({
  settings,
  invoices,
}: SummarizeArgs): InvoiceKind | null {
  if (settings.projectTotal == null || settings.projectTotal <= 0) {
    return invoices.length === 0 ? 'custom' : null
  }

  const paidTotal = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const outstanding = clampCurrency(settings.projectTotal - paidTotal)

  if (outstanding <= 0) {
    return null
  }

  if (settings.paymentPlanType === 'pay_in_full') {
    return invoices.length === 0 ? 'final' : null
  }

  const depositInvoices = invoices.filter((invoice) => invoice.invoiceKind === 'deposit')
  const hasPaidDeposit = depositInvoices.some((invoice) => invoice.status === 'paid')
  const hasOpenDeposit = depositInvoices.some((invoice) => isOpenInvoiceStatus(invoice.status))

  if (!hasPaidDeposit && !hasOpenDeposit) {
    return 'deposit'
  }

  if (settings.paymentPlanType === 'deposit_and_balance') {
    return outstanding > 0 ? 'final' : null
  }

  const nonDepositOpen = invoices.some(
    (invoice) => invoice.invoiceKind !== 'deposit' && isOpenInvoiceStatus(invoice.status)
  )

  if (nonDepositOpen) {
    return null
  }

  return 'payment'
}

export function summarizeProjectPayments(args: SummarizeArgs): ProjectPaymentSummary {
  const projectTotal = args.settings.projectTotal ?? 0
  const amountPaid = clampCurrency(
    args.invoices
      .filter((invoice) => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0)
  )
  const amountOutstanding = clampCurrency(projectTotal - amountPaid)
  const depositAmount = getDepositAmount(args.settings)
  const depositInvoices = args.invoices.filter((invoice) => invoice.invoiceKind === 'deposit')

  let depositStatus: DepositStatus = 'not_applicable'
  if (args.settings.paymentPlanType !== 'pay_in_full' && depositAmount != null && depositAmount > 0) {
    if (depositInvoices.some((invoice) => invoice.status === 'paid')) {
      depositStatus = 'paid'
    } else if (depositInvoices.some((invoice) => isOpenInvoiceStatus(invoice.status))) {
      depositStatus = 'unpaid'
    } else {
      depositStatus = 'not_sent'
    }
  }

  return {
    amountPaid,
    amountOutstanding,
    depositStatus,
    nextSuggestedInvoiceKind: getNextSuggestedInvoiceKind(args),
  }
}

export function buildInvoiceDefaults(args: BuildInvoiceDefaultsArgs): InvoiceDefaults {
  const projectTotal = args.settings.projectTotal ?? 0
  const depositAmount = getDepositAmount(args.settings)
  const paidTotal = args.existingInvoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const totalAlreadyCreated = args.existingInvoices
    .filter((invoice) => invoice.status !== 'cancelled')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const remainingByPaid = clampCurrency(projectTotal - paidTotal)
  const remainingByCreated = clampCurrency(projectTotal - totalAlreadyCreated)

  switch (args.invoiceKind) {
    case 'deposit':
      return {
        title: 'Deposit to hold your date',
        amount: depositAmount ?? 0,
      }
    case 'payment':
      return {
        title: 'Payment',
        amount: remainingByCreated,
      }
    case 'final':
      return {
        title: 'Final payment',
        amount:
          args.settings.paymentPlanType === 'pay_in_full' ? projectTotal : remainingByPaid,
      }
    case 'custom':
      return {
        title: `${args.projectTitle} invoice`,
        amount: remainingByCreated,
      }
    default: {
      const exhaustiveCheck: never = args.invoiceKind
      return exhaustiveCheck
    }
  }
}
