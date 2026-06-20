import multer from 'multer'

const pdfFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = file.originalname.toLowerCase().endsWith('.pdf')
  const mimeOk =
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-pdf' ||
    file.mimetype === 'application/octet-stream'
  if (ext && mimeOk) {
    cb(null, true)
    return
  }
  cb(new Error('Only PDF files are allowed for contracts'))
}

export const quoteContractPdfUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFilter,
  limits: {
    fileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10),
    files: 1,
  },
})
