import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getPool } from '../config/database'
import {
  CONTRACT_CONSENT_TEXT,
  CONTRACT_CONSENT_VERSION,
  CONTRACT_MIN_VIEW_SECONDS,
} from '../constants/contractConsent'
import { sha256File } from '../utils/fileHash'
import type { QuoteStatus } from './Quote'

const uploadDir = path.join(process.cwd(), 'uploads')

export interface IQuoteContract {
  id: number
  quoteId: number
  title: string
  filePath: string
  fileName: string
  fileSizeBytes: number | null
  mimeType: string
  uploadedBy: number
  acknowledgedAt: Date | null
  acknowledgementLegalName: string | null
  acknowledgementIp: string | null
  acknowledgementUserAgent: string | null
  acknowledgementPdfHash: string | null
  acknowledgementViewSeconds: number | null
  acknowledgementScrolledToEnd: boolean | null
  acknowledgementConsentVersion: string | null
  createdAt: Date
}

export interface IQuoteContractSummary {
  title: string
  fileName: string
  fileAvailable: boolean
  viewOnly: boolean
  canSign: boolean
  acknowledgedAt: string | null
  acknowledgementLegalName: string | null
}

export interface IQuoteContractSigningContext {
  title: string
  pdfHash: string
  suggestedLegalName: string
  minViewSeconds: number
  consentVersion: string
  consentText: string
  viewOnly: boolean
  canSign: boolean
  alreadyAcknowledged: boolean
  acknowledgedAt: string | null
  acknowledgementLegalName: string | null
}

export interface IQuoteContractAcknowledgeInput {
  legalName: string
  pdfHash: string
  viewDurationSeconds: number
  scrolledToEnd: boolean
  consentAccepted: boolean
}

type QuoteContractRow = {
  id: number
  quote_id: number
  title: string
  file_path: string
  file_name: string
  file_size_bytes: number | null
  mime_type: string
  uploaded_by: number
  acknowledged_at?: Date | null
  acknowledgement_legal_name?: string | null
  acknowledgement_ip?: string | null
  acknowledgement_user_agent?: string | null
  acknowledgement_pdf_hash?: string | null
  acknowledgement_view_seconds?: number | null
  acknowledgement_scrolled_to_end?: boolean | null
  acknowledgement_consent_version?: string | null
  created_at: Date
}

function mapRow(row: QuoteContractRow): IQuoteContract {
  return {
    id: row.id,
    quoteId: row.quote_id,
    title: row.title,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    acknowledgedAt: row.acknowledged_at ?? null,
    acknowledgementLegalName: row.acknowledgement_legal_name ?? null,
    acknowledgementIp: row.acknowledgement_ip ?? null,
    acknowledgementUserAgent: row.acknowledgement_user_agent ?? null,
    acknowledgementPdfHash: row.acknowledgement_pdf_hash ?? null,
    acknowledgementViewSeconds:
      row.acknowledgement_view_seconds != null ? Number(row.acknowledgement_view_seconds) : null,
    acknowledgementScrolledToEnd: row.acknowledgement_scrolled_to_end ?? null,
    acknowledgementConsentVersion: row.acknowledgement_consent_version ?? null,
    createdAt: row.created_at,
  }
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, '/')
}

function canSignForQuoteStatus(status: QuoteStatus): boolean {
  return status === 'accepted' || status === 'converted'
}

export class QuoteContractModel {
  static getAbsolutePath(relativePath: string): string {
    const normalized = normalizeRelativePath(relativePath)
    return path.join(uploadDir, ...normalized.split('/'))
  }

  static fileExists(relativePath: string): boolean {
    return fs.existsSync(this.getAbsolutePath(relativePath))
  }

  static toSummary(
    contract: IQuoteContract | null,
    quoteStatus: QuoteStatus
  ): IQuoteContractSummary | null {
    if (!contract) {
      return null
    }

    const signed = !!contract.acknowledgedAt
    const accepted = canSignForQuoteStatus(quoteStatus)

    return {
      title: contract.title,
      fileName: contract.fileName,
      fileAvailable: this.fileExists(contract.filePath),
      viewOnly: !accepted,
      canSign: accepted && !signed,
      acknowledgedAt: contract.acknowledgedAt ? contract.acknowledgedAt.toISOString() : null,
      acknowledgementLegalName: contract.acknowledgementLegalName,
    }
  }

  static async findByQuoteId(quoteId: number): Promise<IQuoteContract | null> {
    const pool = getPool()
    const result = await pool.query(`SELECT * FROM quote_contracts WHERE quote_id = $1 LIMIT 1`, [
      quoteId,
    ])
    if (result.rows.length === 0) {
      return null
    }
    return mapRow(result.rows[0] as QuoteContractRow)
  }

  static async findByQuoteIdForVendor(
    quoteId: number,
    vendorId: number
  ): Promise<IQuoteContract | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT qc.*
      FROM quote_contracts qc
      INNER JOIN quotes q ON q.id = qc.quote_id
      WHERE qc.quote_id = $1 AND q.vendor_id = $2
      LIMIT 1
      `,
      [quoteId, vendorId]
    )
    if (result.rows.length === 0) {
      return null
    }
    return mapRow(result.rows[0] as QuoteContractRow)
  }

  static async findByQuoteToken(token: string): Promise<IQuoteContract | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT qc.*
      FROM quote_contracts qc
      INNER JOIN quotes q ON q.id = qc.quote_id
      WHERE q.token = $1
      LIMIT 1
      `,
      [token]
    )
    if (result.rows.length === 0) {
      return null
    }
    return mapRow(result.rows[0] as QuoteContractRow)
  }

  static async getSigningContext(token: string): Promise<IQuoteContractSigningContext | null> {
    const pool = getPool()
    const quoteResult = await pool.query(
      `SELECT id, status, client_name FROM quotes WHERE token = $1 LIMIT 1`,
      [token]
    )
    if (quoteResult.rows.length === 0) {
      return null
    }

    const quoteRow = quoteResult.rows[0]
    const quoteStatus = quoteRow.status as QuoteStatus
    const contract = await this.findByQuoteId(quoteRow.id as number)
    if (!contract) {
      return null
    }

    if (!this.fileExists(contract.filePath)) {
      return null
    }

    const absolutePath = this.getAbsolutePath(contract.filePath)
    const pdfHash = await sha256File(absolutePath)
    const suggestedLegalName = String(quoteRow.client_name ?? '').trim()
    const signed = !!contract.acknowledgedAt
    const accepted = canSignForQuoteStatus(quoteStatus)

    return {
      title: contract.title,
      pdfHash,
      suggestedLegalName,
      minViewSeconds: CONTRACT_MIN_VIEW_SECONDS,
      consentVersion: CONTRACT_CONSENT_VERSION,
      consentText: CONTRACT_CONSENT_TEXT,
      viewOnly: !accepted,
      canSign: accepted && !signed,
      alreadyAcknowledged: signed,
      acknowledgedAt: contract.acknowledgedAt ? contract.acknowledgedAt.toISOString() : null,
      acknowledgementLegalName: contract.acknowledgementLegalName,
    }
  }

  static async acknowledge(
    token: string,
    acknowledgementIp: string | null,
    userAgent: string | null,
    input: IQuoteContractAcknowledgeInput
  ): Promise<IQuoteContractSummary | null> {
    const pool = getPool()
    const quoteResult = await pool.query(
      `SELECT id, status FROM quotes WHERE token = $1 LIMIT 1`,
      [token]
    )
    if (quoteResult.rows.length === 0) {
      return null
    }

    const quoteId = quoteResult.rows[0].id as number
    const quoteStatus = quoteResult.rows[0].status as QuoteStatus

    if (!canSignForQuoteStatus(quoteStatus)) {
      throw new Error('QUOTE_NOT_ACCEPTED')
    }

    const contract = await this.findByQuoteId(quoteId)
    if (!contract) {
      return null
    }

    if (contract.acknowledgedAt) {
      return this.toSummary(contract, quoteStatus)
    }

    const legalName = input.legalName.trim().replace(/\s+/g, ' ')
    if (legalName.length < 2) {
      throw new Error('LEGAL_NAME_REQUIRED')
    }

    if (!input.consentAccepted) {
      throw new Error('CONSENT_REQUIRED')
    }

    const absolutePath = this.getAbsolutePath(contract.filePath)
    const serverPdfHash = await sha256File(absolutePath)
    if (input.pdfHash !== serverPdfHash) {
      throw new Error('PDF_HASH_MISMATCH')
    }

    const meetsViewRequirement =
      input.scrolledToEnd || input.viewDurationSeconds >= CONTRACT_MIN_VIEW_SECONDS

    if (!meetsViewRequirement) {
      throw new Error('REVIEW_INCOMPLETE')
    }

    const result = await pool.query(
      `
      UPDATE quote_contracts
      SET acknowledged_at = NOW(),
          acknowledgement_legal_name = $2,
          acknowledgement_ip = $3,
          acknowledgement_user_agent = $4,
          acknowledgement_pdf_hash = $5,
          acknowledgement_view_seconds = $6,
          acknowledgement_scrolled_to_end = $7,
          acknowledgement_consent_version = $8
      WHERE quote_id = $1
      RETURNING *
      `,
      [
        quoteId,
        legalName,
        acknowledgementIp,
        userAgent,
        serverPdfHash,
        Math.max(0, Math.floor(input.viewDurationSeconds)),
        input.scrolledToEnd,
        CONTRACT_CONSENT_VERSION,
      ]
    )

    const updated = mapRow(result.rows[0] as QuoteContractRow)
    return this.toSummary(updated, quoteStatus)
  }

  static async attach(
    quoteId: number,
    vendorId: number,
    data: {
      title: string
      buffer: Buffer
      originalFileName: string
      fileSizeBytes: number
      mimeType: string
    }
  ): Promise<IQuoteContractSummary> {
    const pool = getPool()

    const quoteCheck = await pool.query(
      `SELECT id, status FROM quotes WHERE id = $1 AND vendor_id = $2`,
      [quoteId, vendorId]
    )
    if (quoteCheck.rows.length === 0) {
      throw new Error('QUOTE_NOT_FOUND')
    }

    const existing = await this.findByQuoteId(quoteId)
    if (existing) {
      throw new Error('QUOTE_CONTRACT_ALREADY_EXISTS')
    }

    const dir = path.join(uploadDir, 'quote-contracts', String(quoteId))
    ensureDir(dir)
    const storedName = `${uuidv4()}.pdf`
    const absolutePath = path.join(dir, storedName)
    fs.writeFileSync(absolutePath, data.buffer)

    const relativePath = path.posix.join('quote-contracts', String(quoteId), storedName)
    const quoteStatus = quoteCheck.rows[0].status as QuoteStatus

    const result = await pool.query(
      `
      INSERT INTO quote_contracts (
        quote_id, title, file_path, file_name, file_size_bytes, mime_type, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        quoteId,
        data.title.trim(),
        relativePath,
        data.originalFileName,
        data.fileSizeBytes,
        data.mimeType,
        vendorId,
      ]
    )

    const contract = mapRow(result.rows[0] as QuoteContractRow)
    const summary = this.toSummary(contract, quoteStatus)
    if (!summary) {
      throw new Error('QUOTE_CONTRACT_CREATE_FAILED')
    }
    return summary
  }

  static async replaceOrAttach(
    quoteId: number,
    vendorId: number,
    data: {
      title: string
      buffer: Buffer
      originalFileName: string
      fileSizeBytes: number
      mimeType: string
    }
  ): Promise<IQuoteContractSummary> {
    const pool = getPool()

    const quoteCheck = await pool.query(
      `SELECT id, status FROM quotes WHERE id = $1 AND vendor_id = $2`,
      [quoteId, vendorId]
    )
    if (quoteCheck.rows.length === 0) {
      throw new Error('QUOTE_NOT_FOUND')
    }

    const quoteStatus = quoteCheck.rows[0].status as QuoteStatus
    if (quoteStatus === 'converted' || quoteStatus === 'declined') {
      throw new Error('QUOTE_CONTRACT_UPLOAD_NOT_ALLOWED')
    }

    const existing = await this.findByQuoteId(quoteId)
    if (existing?.acknowledgedAt) {
      throw new Error('QUOTE_CONTRACT_ALREADY_SIGNED')
    }

    if (!existing) {
      return this.attach(quoteId, vendorId, data)
    }

    const dir = path.join(uploadDir, 'quote-contracts', String(quoteId))
    ensureDir(dir)
    const storedName = `${uuidv4()}.pdf`
    const absolutePath = path.join(dir, storedName)
    fs.writeFileSync(absolutePath, data.buffer)

    const relativePath = path.posix.join('quote-contracts', String(quoteId), storedName)
    const oldPath = existing.filePath

    const result = await pool.query(
      `
      UPDATE quote_contracts
      SET title = $2,
          file_path = $3,
          file_name = $4,
          file_size_bytes = $5,
          mime_type = $6,
          uploaded_by = $7
      WHERE quote_id = $1
      RETURNING *
      `,
      [
        quoteId,
        data.title.trim(),
        relativePath,
        data.originalFileName,
        data.fileSizeBytes,
        data.mimeType,
        vendorId,
      ]
    )

    const oldAbsolute = this.getAbsolutePath(oldPath)
    if (oldAbsolute !== absolutePath && fs.existsSync(oldAbsolute)) {
      fs.unlinkSync(oldAbsolute)
    }

    const contract = mapRow(result.rows[0] as QuoteContractRow)
    const summary = this.toSummary(contract, quoteStatus)
    if (!summary) {
      throw new Error('QUOTE_CONTRACT_CREATE_FAILED')
    }
    return summary
  }

  static async copyToProject(
    quoteId: number,
    projectId: number,
    vendorId: number
  ): Promise<void> {
    const quoteContract = await this.findByQuoteIdForVendor(quoteId, vendorId)
    if (!quoteContract) {
      return
    }

    const srcPath = this.getAbsolutePath(quoteContract.filePath)
    if (!fs.existsSync(srcPath)) {
      throw new Error('QUOTE_CONTRACT_FILE_MISSING')
    }

    const destDir = path.join(uploadDir, 'contracts', String(projectId))
    ensureDir(destDir)
    const storedName = `${uuidv4()}.pdf`
    const destPath = path.join(destDir, storedName)
    fs.copyFileSync(srcPath, destPath)

    const relativePath = path.posix.join('contracts', String(projectId), storedName)

    const pool = getPool()
    await pool.query(
      `
      INSERT INTO contracts (
        project_id, title, file_path, file_name, file_size_bytes, mime_type, uploaded_by,
        acknowledged_at, acknowledgement_ip, acknowledgement_legal_name,
        acknowledgement_user_agent, acknowledgement_pdf_hash, acknowledgement_view_seconds,
        acknowledgement_scrolled_to_end, acknowledgement_consent_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `,
      [
        projectId,
        quoteContract.title,
        relativePath,
        quoteContract.fileName,
        quoteContract.fileSizeBytes,
        quoteContract.mimeType,
        vendorId,
        quoteContract.acknowledgedAt,
        quoteContract.acknowledgementIp,
        quoteContract.acknowledgementLegalName,
        quoteContract.acknowledgementUserAgent,
        quoteContract.acknowledgementPdfHash,
        quoteContract.acknowledgementViewSeconds,
        quoteContract.acknowledgementScrolledToEnd,
        quoteContract.acknowledgementConsentVersion,
      ]
    )
  }
}

export const QuoteContract = QuoteContractModel
