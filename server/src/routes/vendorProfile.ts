import { Router, Response } from 'express'
import { protect, authorize, AuthRequest } from '../middleware/auth'
import { vendorLogoPublicPath, vendorLogoUpload } from '../middleware/vendorLogoUpload'
import { VendorProfile } from '../models/VendorProfile'
import { logger } from '../utils/logger'

const router = Router()

router.use(protect, authorize('VENDOR'))

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await VendorProfile.findByUserId(Number(req.user.id))
    if (!profile) {
      res.status(404).json({ error: 'Vendor profile not found' })
      return
    }
    res.json({ profile })
  } catch (error) {
    logger.error('Get vendor profile error:', error)
    res.status(500).json({ error: 'Failed to load profile' })
  }
})

router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await VendorProfile.update(Number(req.user.id), {
      businessName: req.body.businessName,
      serviceType: req.body.serviceType,
      tagline: req.body.tagline,
      primaryColor: req.body.primaryColor,
      secondaryColor: req.body.secondaryColor,
      website: req.body.website,
      businessPhone: req.body.businessPhone,
      businessEmail: req.body.businessEmail,
    })
    res.json({ profile })
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'BUSINESS_NAME_REQUIRED':
          res.status(400).json({ error: 'Business name is required' })
          return
        case 'INVALID_PRIMARY_COLOR':
        case 'INVALID_SECONDARY_COLOR':
          res.status(400).json({ error: 'Brand colors must be valid hex values (e.g. #2563eb)' })
          return
        case 'PROFILE_NOT_FOUND':
          res.status(404).json({ error: 'Vendor profile not found' })
          return
      }
    }
    logger.error('Update vendor profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

router.post(
  '/logo',
  (req, res, next) => {
    vendorLogoUpload.single('logo')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Logo upload failed'
        res.status(400).json({ error: message })
        return
      }
      next()
    })
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Logo file is required' })
        return
      }

      const logoUrl = vendorLogoPublicPath(req.file.filename)
      const profile = await VendorProfile.update(Number(req.user.id), { logoUrl })
      res.json({ profile, logoUrl })
    } catch (error) {
      logger.error('Upload vendor logo error:', error)
      res.status(500).json({ error: 'Failed to upload logo' })
    }
  }
)

export default router
