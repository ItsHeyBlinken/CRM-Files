import { buildVendorDashboardSummary } from './vendorDashboardSummary'

describe('vendorDashboardSummary', () => {
  test('builds attention items for quotes, invites, and payment claims', () => {
    const summary = buildVendorDashboardSummary({
      quotes: [
        {
          id: 1,
          title: 'Pending Quote',
          status: 'sent',
          expiresAt: new Date(Date.now() + 86400000),
          clientName: 'Alex',
          clientEmail: 'alex@example.com',
          projectId: null,
          contract: null,
        },
        {
          id: 2,
          title: 'Accepted Quote',
          status: 'accepted',
          expiresAt: new Date(Date.now() + 86400000),
          clientName: 'Sam',
          clientEmail: 'sam@example.com',
          projectId: null,
          contract: { acknowledgedAt: null },
        },
      ],
      projects: [
        {
          id: 10,
          title: 'Miller Gala',
          clientEmail: 'client@example.com',
          hasLinkedClient: false,
        },
      ],
      invoices: [
        {
          id: 5,
          projectId: 10,
          title: 'Deposit',
          status: 'sent',
          clientPaymentClaimedAt: new Date(),
        },
      ],
      calendarEvents: [
        {
          id: 'project-10',
          title: 'Miller Gala',
          eventDate: '2026-12-01',
          kind: 'project',
          linkPath: '/dashboard/projects/10',
        },
      ],
    })

    expect(summary.stats.quotesAwaitingResponse).toBe(1)
    expect(summary.stats.quotesReadyToConvert).toBe(1)
    expect(summary.stats.paymentClaimsPending).toBe(1)
    expect(summary.attention.some((item) => item.kind === 'invoice_payment_claimed')).toBe(true)
    expect(summary.upcomingEvents).toHaveLength(1)
  })
})
