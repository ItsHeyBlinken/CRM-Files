import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { Project } from '../models/Project'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('CLIENT'))

// GET /api/portal/project
router.get('/project', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const portalProject = await Project.findClientProject(Number(req.user.id))

    if (!portalProject) {
      res.status(404).json({
        error: 'No project linked to your account yet. Ask your vendor to send an invite.',
      })
      return
    }

    res.json(portalProject)
  } catch (error) {
    logger.error('Portal project error:', error)
    res.status(500).json({ error: 'Failed to load your project' })
  }
})

export default router
