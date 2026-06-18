import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { Project } from '../models/Project'
import { Contract } from '../models/Contract'
import { Deliverable } from '../models/Deliverable'
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

// GET /api/portal/contracts/:id/file
router.get('/contracts/:id/file', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findByIdForClient(
      Number(req.params['id']),
      Number(req.user.id)
    )

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' })
      return
    }

    const absolutePath = Contract.getAbsolutePath(contract.filePath)
    res.setHeader('Content-Type', contract.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${contract.fileName}"`)
    res.sendFile(absolutePath, (err) => {
      if (err) {
        logger.error('Contract file send error:', err)
        if (!res.headersSent) {
          res.status(404).json({ error: 'Contract file not found on server' })
        }
      }
    })
  } catch (error) {
    logger.error('Contract file error:', error)
    res.status(500).json({ error: 'Failed to load contract' })
  }
})

// POST /api/portal/contracts/:id/acknowledge
router.post('/contracts/:id/acknowledge', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const forwarded = req.headers['x-forwarded-for']
    const acknowledgementIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim() ?? null
        : req.ip ?? null

    const contract = await Contract.acknowledge(
      Number(req.params['id']),
      Number(req.user.id),
      acknowledgementIp
    )

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' })
      return
    }

    res.json({ contract })
  } catch (error) {
    logger.error('Contract acknowledge error:', error)
    res.status(500).json({ error: 'Failed to acknowledge contract' })
  }
})

// GET /api/portal/deliverables/:id/file
router.get('/deliverables/:id/file', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deliverable = await Deliverable.findByIdForClient(
      Number(req.params['id']),
      Number(req.user.id)
    )

    if (!deliverable) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    const absolutePath = Deliverable.getAbsolutePath(deliverable.filePath)
    const mimeType = deliverable.mimeType || 'application/octet-stream'
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${deliverable.fileName}"`)
    res.sendFile(absolutePath, (err) => {
      if (err) {
        logger.error('Deliverable file send error:', err)
        if (!res.headersSent) {
          res.status(404).json({ error: 'File not found on server' })
        }
      }
    })
  } catch (error) {
    logger.error('Deliverable file error:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

export default router
