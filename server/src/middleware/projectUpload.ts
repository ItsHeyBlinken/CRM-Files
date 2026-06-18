import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const uploadDir = path.join(process.cwd(), 'uploads')

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function createPdfUpload(subfolder: 'contracts' | 'deliverables'): multer.Multer {
  const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      const projectId = req.params['id']
      if (!projectId) {
        cb(new Error('Project ID required'), '')
        return
      }
      const dir = path.join(uploadDir, subfolder, String(projectId))
      ensureDir(dir)
      cb(null, dir)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.pdf'
      cb(null, `${uuidv4()}${ext}`)
    },
  })

  const pdfFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === '.pdf' && file.mimetype === 'application/pdf') {
      cb(null, true)
      return
    }
    cb(new Error('Only PDF files are allowed'))
  }

  return multer({
    storage,
    fileFilter: pdfFilter,
    limits: {
      fileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10),
      files: 1,
    },
  })
}

export const contractPdfUpload = createPdfUpload('contracts')
