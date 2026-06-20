import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { getPool } from '../config/database'
import { Quote } from '../models/Quote'
import { Project } from '../models/Project'
import { buildVendorCalendarSnapshot } from '../utils/vendorCalendar'
import { buildVendorDashboardSummary } from '../utils/vendorDashboardSummary'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = Number(req.user.id)
    const pool = getPool()

    const [quotes, projects, invoiceResult, linkedClientsResult] = await Promise.all([
      Quote.findByVendorId(vendorId),
      Project.findByVendorId(vendorId),
      pool.query(
        `
        SELECT i.id, i.project_id, i.title, i.status, i.client_payment_claimed_at
        FROM invoices i
        INNER JOIN projects p ON p.id = i.project_id
        WHERE p.vendor_id = $1
        ORDER BY i.updated_at DESC
        `,
        [vendorId]
      ),
      pool.query(
        `
        SELECT pc.project_id
        FROM project_clients pc
        INNER JOIN projects p ON p.id = pc.project_id
        WHERE p.vendor_id = $1
        `,
        [vendorId]
      ),
    ])

    const linkedProjectIds = new Set<number>(
      linkedClientsResult.rows.map((row: { project_id: number }) => row.project_id)
    )

    const calendar = buildVendorCalendarSnapshot({
      projects: projects.map((project) => ({
        id: project.id,
        title: project.title,
        eventDate: project.eventDate,
        status: project.status,
        clientDisplayName: project.clientDisplayName,
        location: project.location,
      })),
      quotes: quotes.map((quote) => ({
        id: quote.id,
        title: quote.title,
        eventDate: quote.eventDate,
        status: quote.status,
        clientName: quote.clientName,
        location: quote.location,
      })),
    })

    const summary = buildVendorDashboardSummary({
      quotes: quotes.map((quote) => ({
        id: quote.id,
        title: quote.title,
        status: quote.status,
        expiresAt: quote.expiresAt,
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        projectId: quote.projectId,
        contract: quote.contract
          ? { acknowledgedAt: quote.contract.acknowledgedAt ? new Date(quote.contract.acknowledgedAt) : null }
          : null,
      })),
      projects: projects.map((project) => ({
        id: project.id,
        title: project.title,
        clientEmail: project.clientEmail,
        hasLinkedClient: linkedProjectIds.has(project.id),
      })),
      invoices: invoiceResult.rows.map(
        (row: {
          id: number
          project_id: number
          title: string
          status: string
          client_payment_claimed_at: Date | null
        }) => ({
          id: row.id,
          projectId: row.project_id,
          title: row.title,
          status: row.status,
          clientPaymentClaimedAt: row.client_payment_claimed_at,
        })
      ),
      calendarEvents: calendar.events.map((event) => ({
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        kind: event.kind,
        linkPath: event.linkPath,
      })),
    })

    res.json({ summary })
  } catch (error) {
    logger.error('Vendor dashboard summary error:', error)
    res.status(500).json({ error: 'Failed to load dashboard summary' })
  }
})

export default router
