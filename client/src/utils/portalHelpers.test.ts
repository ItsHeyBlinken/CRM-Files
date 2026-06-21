import { describe, expect, test } from 'vitest'
import { getInvoiceDisplayLabel, getNextAction } from './portalHelpers'
import type { ClientPortalData } from '../types/portal'

function buildPortalData(): ClientPortalData {
  return {
    project: {
      id: 1,
      vendorId: 2,
      title: 'Miller Celebration',
      description: null,
      eventDate: '2026-09-12',
      location: null,
      status: 'booked',
      clientDisplayName: 'Alex Miller',
      clientEmail: 'client@test.com',
    },
    vendorBusinessName: 'Sam Photography',
    vendorLogoUrl: null,
    vendorTagline: 'Capturing your day, beautifully.',
    primaryColor: '#2563eb',
    paymentOptions: {
      stripeEnabled: true,
      venmoHandle: null,
      zelleHandle: null,
      cashappHandle: null,
      paypalHandle: null,
      paymentInstructions: null,
    },
    paymentSettings: {
      projectTotal: 3000,
      paymentPlanType: 'deposit_and_balance',
      depositType: 'percentage',
      depositValue: 30,
      secondPaymentDueDaysBeforeEvent: null,
      finalPaymentDueDaysBeforeEvent: 14,
    },
    paymentSummary: {
      amountPaid: 0,
      amountOutstanding: 3000,
      depositStatus: 'unpaid',
      nextSuggestedInvoiceKind: 'deposit',
    },
    milestones: [],
    invoices: [
      {
        id: 10,
        invoiceNumber: 'INV-100',
        title: 'Booking deposit',
        description: null,
        amount: 900,
        currency: 'USD',
        dueDate: '2026-06-21',
        status: 'sent',
        invoiceKind: 'deposit',
        isDateHoldingDeposit: true,
      },
    ],
    contracts: [],
  }
}

describe('portalHelpers', () => {
  test('prioritizes paying a deposit as the next client action', () => {
    const nextAction = getNextAction(buildPortalData())

    expect(nextAction).toEqual({
      label: 'Pay your deposit',
      description: 'Booking deposit — $900.00',
      tab: 'payments',
    })
  })

  test('labels deposit invoices clearly for the client portal', () => {
    expect(
      getInvoiceDisplayLabel({
        title: 'Booking deposit',
        invoiceKind: 'deposit',
        isDateHoldingDeposit: true,
      })
    ).toBe('Deposit to hold your date')
  })
})
