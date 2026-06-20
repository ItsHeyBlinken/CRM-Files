import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { VendorNotification } from '../models/VendorNotification'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = Number(req.user.id)
    const [notifications, unreadCount] = await Promise.all([
      VendorNotification.listForVendor(vendorId),
      VendorNotification.getUnreadCount(vendorId),
    ])
    res.json({ notifications, unreadCount })
  } catch (error) {
    logger.error('List notifications error:', error)
    res.status(500).json({ error: 'Failed to load notifications' })
  }
})

router.patch('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = Number(req.user.id)
    const marked = await VendorNotification.markAllRead(vendorId)
    res.json({ marked, unreadCount: 0 })
  } catch (error) {
    logger.error('Mark all notifications read error:', error)
    res.status(500).json({ error: 'Failed to update notifications' })
  }
})

router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = Number(req.user.id)
    const notificationId = Number(req.params['id'])
    const notification = await VendorNotification.markRead(notificationId, vendorId)

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' })
      return
    }

    const unreadCount = await VendorNotification.getUnreadCount(vendorId)
    res.json({ notification, unreadCount })
  } catch (error) {
    logger.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Failed to update notification' })
  }
})

export default router
