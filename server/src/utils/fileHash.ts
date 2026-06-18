import crypto from 'crypto'
import fs from 'fs'

export async function sha256File(absolutePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(absolutePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

export function normalizeLegalName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}
