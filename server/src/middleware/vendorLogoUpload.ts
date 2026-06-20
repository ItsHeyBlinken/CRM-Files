import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadRoot = path.join(process.cwd(), 'uploads', 'vendor-logos')

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export const vendorLogoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(uploadRoot)
      cb(null, uploadRoot)
    },
    filename: (req, file, cb) => {
      const vendorId = (req as { user?: { id?: number } }).user?.id ?? 'unknown'
      const ext = path.extname(file.originalname).toLowerCase() || '.png'
      cb(null, `vendor-${vendorId}-${Date.now()}${ext}`)
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new Error('Logo must be a JPEG, PNG, WebP, or GIF image'))
  },
})

export function vendorLogoPublicPath(filename: string): string {
  return `/uploads/vendor-logos/${filename}`
}

export function vendorLogoAbsolutePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath.replace(/^\//, ''))
}
