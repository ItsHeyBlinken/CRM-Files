import { Router, Response, NextFunction } from 'express'
import path from 'path'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { contractPdfUpload } from '../middleware/projectUpload'
import { Project, ProjectStatus } from '../models/Project'
import { Contract } from '../models/Contract'
import { logger } from '../utils/logger'

const router = Router()

const VALID_STATUSES: ProjectStatus[] = [
  'inquiry',
  'booked',
  'in_progress',
  'delivered',
  'complete',
  'cancelled',
]

router.use(protect, authorize('VENDOR'))

// GET /api/vendor/projects
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await Project.findByVendorId(Number(req.user.id))
    res.json({ projects })
  } catch (error) {
    logger.error('List projects error:', error)
    res.status(500).json({ error: 'Failed to load projects' })
  }
})

// POST /api/vendor/projects
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, weddingDate, location, status, coupleDisplayName, clientEmail, internalNotes } =
      req.body

    if (!title?.trim()) {
      res.status(400).json({ error: 'Project title is required' })
      return
    }

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid project status' })
      return
    }

    const project = await Project.create(Number(req.user.id), {
      title: title.trim(),
      description,
      weddingDate,
      location,
      status,
      coupleDisplayName,
      clientEmail,
      internalNotes,
    })

    res.status(201).json({ project })
  } catch (error) {
    logger.error('Create project error:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// GET /api/vendor/projects/:id/contracts
router.get('/:id/contracts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number(req.params['id'])
    const contracts = await Contract.findByProjectForVendor(projectId, Number(req.user.id))
    res.json({ contracts })
  } catch (error) {
    logger.error('List contracts error:', error)
    res.status(500).json({ error: 'Failed to load contracts' })
  }
})

// POST /api/vendor/projects/:id/contracts
router.post(
  '/:id/contracts',
  (req: AuthRequest, res: Response, next: NextFunction) => {
    contractPdfUpload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'File upload failed'
        res.status(400).json({ error: message })
        return
      }
      next()
    })
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectId = Number(req.params['id'])
      const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''

      if (!title) {
        res.status(400).json({ error: 'Contract title is required' })
        return
      }

      if (!req.file) {
        res.status(400).json({ error: 'PDF file is required' })
        return
      }

      const relativeFilePath = path.join('contracts', String(projectId), req.file.filename)

      const contract = await Contract.create(projectId, Number(req.user.id), {
        title,
        relativeFilePath: relativeFilePath.replace(/\\/g, '/'),
        fileName: req.file.originalname,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
      })

      res.status(201).json({ contract })
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      if (error instanceof Error && error.message === 'CONTRACT_ALREADY_EXISTS') {
        res.status(409).json({
          error: 'This project already has a contract. MVP supports one contract per project.',
        })
        return
      }
      logger.error('Upload contract error:', error)
      res.status(500).json({ error: 'Failed to upload contract' })
    }
  }
)

// GET /api/vendor/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findByIdForVendor(
      Number(req.params['id']),
      Number(req.user.id)
    )

    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.json({ project })
  } catch (error) {
    logger.error('Get project error:', error)
    res.status(500).json({ error: 'Failed to load project' })
  }
})

// PUT /api/vendor/projects/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid project status' })
      return
    }

    const project = await Project.update(
      Number(req.params['id']),
      Number(req.user.id),
      req.body
    )

    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.json({ project })
  } catch (error) {
    logger.error('Update project error:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// DELETE /api/vendor/projects/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await Project.delete(Number(req.params['id']), Number(req.user.id))

    if (!deleted) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.json({ message: 'Project deleted' })
  } catch (error) {
    logger.error('Delete project error:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// POST /api/vendor/projects/:id/invite
router.post('/:id/invite', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, expiresInDays } = req.body

    if (!email?.trim()) {
      res.status(400).json({ error: 'Client email is required' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    const invite = await Project.createInvite(
      Number(req.params['id']),
      Number(req.user.id),
      email,
      expiresInDays ?? 14
    )

    res.status(201).json({
      invite: {
        ...invite,
        invitePath: `/invite/${invite.token}`,
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    if (error instanceof Error && error.message === 'PROJECT_ALREADY_HAS_CLIENT') {
      res.status(409).json({
        error:
          'This project already has a client on the portal. MVP supports one couple per project — create a new project to invite someone else.',
      })
      return
    }
    logger.error('Create invite error:', error)
    res.status(500).json({ error: 'Failed to create invite' })
  }
})

export default router
