import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { Project } from '../models/Project'
import { Quote } from '../models/Quote'
import { buildVendorCalendarSnapshot } from '../utils/vendorCalendar'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

// GET /api/vendor/calendar
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = Number(req.user.id)
    const [projects, quotes] = await Promise.all([
      Project.findByVendorId(vendorId),
      Quote.findByVendorId(vendorId),
    ])

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

    res.json({ calendar })
  } catch (error) {
    logger.error('Vendor calendar error:', error)
    res.status(500).json({ error: 'Failed to load calendar' })
  }
})

export default router
