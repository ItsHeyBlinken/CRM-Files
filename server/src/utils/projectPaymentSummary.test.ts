import {
  buildInvoiceDefaults,
  getNextSuggestedInvoiceKind,
  summarizeProjectPayments,
  type PaymentPlanType,
} from './projectPaymentSummary'

type InvoiceFixture = {
  id: number
  title: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  invoiceKind: 'deposit' | 'payment' | 'final' | 'custom'
}

type SettingsFixture = {
  projectTotal: number | null
  paymentPlanType: PaymentPlanType
  depositType: 'fixed' | 'percentage' | null
  depositValue: number | null
  secondPaymentDueDaysBeforeEvent: number | null
  finalPaymentDueDaysBeforeEvent: number | null
}

describe('summarizeProjectPayments', () => {
  const baseSettings: SettingsFixture = {
    projectTotal: 3000,
    paymentPlanType: 'deposit_and_balance',
    depositType: 'percentage',
    depositValue: 30,
    secondPaymentDueDaysBeforeEvent: null,
    finalPaymentDueDaysBeforeEvent: 14,
  }

  test('marks deposit unpaid when a deposit invoice exists but is not paid', () => {
    const invoices: InvoiceFixture[] = [
      { id: 1, title: 'Deposit', amount: 900, status: 'sent', invoiceKind: 'deposit' },
    ]

    const summary = summarizeProjectPayments({
      settings: baseSettings,
      invoices,
    })

    expect(summary.depositStatus).toBe('unpaid')
    expect(summary.amountPaid).toBe(0)
    expect(summary.amountOutstanding).toBe(3000)
  })

  test('suggests final payment after a paid deposit in a deposit-and-balance project', () => {
    const invoices: InvoiceFixture[] = [
      { id: 1, title: 'Deposit', amount: 900, status: 'paid', invoiceKind: 'deposit' },
    ]

    expect(
      getNextSuggestedInvoiceKind({
        settings: baseSettings,
        invoices,
      })
    ).toBe('final')
  })

  test('uses full project amount for pay-in-full invoice defaults', () => {
    const settings: SettingsFixture = {
      projectTotal: 2500,
      paymentPlanType: 'pay_in_full',
      depositType: null,
      depositValue: null,
      secondPaymentDueDaysBeforeEvent: null,
      finalPaymentDueDaysBeforeEvent: null,
    }

    const defaults = buildInvoiceDefaults({
      projectTitle: 'Miller Celebration',
      settings,
      invoiceKind: 'final',
      existingInvoices: [],
    })

    expect(defaults.title).toBe('Final payment')
    expect(defaults.amount).toBe(2500)
  })
})
