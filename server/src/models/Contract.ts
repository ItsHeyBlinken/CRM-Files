import fs from 'fs'
import path from 'path'
import { getPool } from '../config/database'
import {
  CONTRACT_CONSENT_TEXT,
  CONTRACT_CONSENT_VERSION,
  CONTRACT_MIN_VIEW_SECONDS,
} from '../constants/contractConsent'
import { normalizeLegalName, sha256File } from '../utils/fileHash'

export interface IContract {
  id: number
  projectId: number
  title: string
  filePath: string
  fileName: string
  fileSizeBytes: number | null
  mimeType: string
  uploadedBy: number
  acknowledgedAt: Date | null
  acknowledgedBy: number | null
  acknowledgementIp: string | null
  acknowledgementLegalName: string | null
  acknowledgementUserAgent: string | null
  acknowledgementPdfHash: string | null
  acknowledgementViewSeconds: number | null
  acknowledgementScrolledToEnd: boolean | null
  acknowledgementConsentVersion: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IContractSummary {
  id: number
  title: string
  fileName: string
  fileAvailable: boolean
  acknowledgedAt: Date | null
  acknowledgementLegalName: string | null
  createdAt: Date
}

export interface IContractSigningContext {
  contractId: number
  title: string
  pdfHash: string
  suggestedLegalName: string
  accountLegalName: string
  minViewSeconds: number
  consentVersion: string
  consentText: string
  alreadyAcknowledged: boolean
}

export interface IContractAcknowledgeInput {
  legalName: string
  pdfHash: string
  viewDurationSeconds: number
  scrolledToEnd: boolean
  consentAccepted: boolean
  confirmLegalName?: boolean
}

function mapContractRow(row: {
  id: number
  project_id: number
  title: string
  file_path: string
  file_name: string
  file_size_bytes: number | null
  mime_type: string
  uploaded_by: number
  acknowledged_at: Date | null
  acknowledged_by: number | null
  acknowledgement_ip: string | null
  acknowledgement_legal_name?: string | null
  acknowledgement_user_agent?: string | null
  acknowledgement_pdf_hash?: string | null
  acknowledgement_view_seconds?: number | null
  acknowledgement_scrolled_to_end?: boolean | null
  acknowledgement_consent_version?: string | null
  created_at: Date
  updated_at: Date
}): IContract {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    acknowledgedAt: row.acknowledged_at,
    acknowledgedBy: row.acknowledged_by,
    acknowledgementIp: row.acknowledgement_ip,
    acknowledgementLegalName: row.acknowledgement_legal_name ?? null,
    acknowledgementUserAgent: row.acknowledgement_user_agent ?? null,
    acknowledgementPdfHash: row.acknowledgement_pdf_hash ?? null,
    acknowledgementViewSeconds:
      row.acknowledgement_view_seconds != null ? Number(row.acknowledgement_view_seconds) : null,
    acknowledgementScrolledToEnd: row.acknowledgement_scrolled_to_end ?? null,
    acknowledgementConsentVersion: row.acknowledgement_consent_version ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSummaryRow(
  row: {
    id: number
    title: string
    file_name: string
    file_path?: string
    acknowledged_at: Date | null
    acknowledgement_legal_name?: string | null
    created_at: Date
  },
  filePath?: string
): IContractSummary {
  const resolvedFilePath = filePath ?? row.file_path ?? ''
  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    fileAvailable: resolvedFilePath ? ContractModel.fileExists(resolvedFilePath) : false,
    acknowledgedAt: row.acknowledged_at,
    acknowledgementLegalName: row.acknowledgement_legal_name ?? null,
    createdAt: row.created_at,
  }
}

export class ContractModel {
  static getAbsolutePath(relativePath: string): string {
    return path.join(process.cwd(), 'uploads', relativePath)
  }

  static fileExists(relativePath: string): boolean {
    return fs.existsSync(this.getAbsolutePath(relativePath))
  }

  static async findOneByProjectForVendor(
    projectId: number,
    vendorId: number
  ): Promise<IContract | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT c.*
      FROM contracts c
      INNER JOIN projects p ON p.id = c.project_id
      WHERE c.project_id = $1 AND p.vendor_id = $2
      LIMIT 1
      `,
      [projectId, vendorId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return mapContractRow(result.rows[0])
  }

  static async findByProjectForVendor(
    projectId: number,
    vendorId: number
  ): Promise<IContractSummary[]> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT c.id, c.title, c.file_name, c.file_path, c.acknowledged_at, c.acknowledgement_legal_name, c.created_at
      FROM contracts c
      INNER JOIN projects p ON p.id = c.project_id
      WHERE c.project_id = $1 AND p.vendor_id = $2
      ORDER BY c.id ASC
      `,
      [projectId, vendorId]
    )

    return result.rows.map((row) => mapSummaryRow(row))
  }

  static async countByProject(projectId: number): Promise<number> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM contracts WHERE project_id = $1`,
      [projectId]
    )
    return result.rows[0].count as number
  }

  static async create(
    projectId: number,
    vendorId: number,
    data: {
      title: string
      relativeFilePath: string
      fileName: string
      fileSizeBytes: number
      mimeType: string
    }
  ): Promise<IContractSummary> {
    const pool = getPool()

    const projectCheck = await pool.query(
      `SELECT id FROM projects WHERE id = $1 AND vendor_id = $2`,
      [projectId, vendorId]
    )

    if (projectCheck.rows.length === 0) {
      throw new Error('PROJECT_NOT_FOUND')
    }

    const existingCount = await this.countByProject(projectId)
    if (existingCount > 0) {
      throw new Error('CONTRACT_ALREADY_EXISTS')
    }

    const result = await pool.query(
      `
      INSERT INTO contracts (
        project_id, title, file_path, file_name, file_size_bytes, mime_type, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, file_name, acknowledged_at, acknowledgement_legal_name, created_at
      `,
      [
        projectId,
        data.title,
        data.relativeFilePath,
        data.fileName,
        data.fileSizeBytes,
        data.mimeType,
        vendorId,
      ]
    )

    return mapSummaryRow(result.rows[0], data.relativeFilePath)
  }

  static async replaceFile(
    projectId: number,
    vendorId: number,
    data: {
      title: string
      relativeFilePath: string
      fileName: string
      fileSizeBytes: number
      mimeType: string
    }
  ): Promise<IContractSummary> {
    const existing = await this.findOneByProjectForVendor(projectId, vendorId)
    if (!existing) {
      throw new Error('CONTRACT_NOT_FOUND')
    }

    if (existing.acknowledgedAt) {
      throw new Error('CONTRACT_ALREADY_SIGNED')
    }

    const pool = getPool()
    const oldPath = existing.filePath

    const result = await pool.query(
      `
      UPDATE contracts
      SET title = $2,
          file_path = $3,
          file_name = $4,
          file_size_bytes = $5,
          mime_type = $6,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, file_name, file_path, acknowledged_at, acknowledgement_legal_name, created_at
      `,
      [
        existing.id,
        data.title,
        data.relativeFilePath,
        data.fileName,
        data.fileSizeBytes,
        data.mimeType,
      ]
    )

    const oldAbsolute = this.getAbsolutePath(oldPath)
    const newAbsolute = this.getAbsolutePath(data.relativeFilePath)
    if (oldAbsolute !== newAbsolute && fs.existsSync(oldAbsolute)) {
      fs.unlinkSync(oldAbsolute)
    }

    return mapSummaryRow(result.rows[0])
  }

  static async findByIdForClient(
    contractId: number,
    clientUserId: number
  ): Promise<IContract | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT c.*
      FROM contracts c
      INNER JOIN project_clients pc ON pc.project_id = c.project_id
      WHERE c.id = $1 AND pc.client_user_id = $2
      LIMIT 1
      `,
      [contractId, clientUserId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return mapContractRow(result.rows[0])
  }

  static async getSigningContext(
    contractId: number,
    clientUserId: number
  ): Promise<IContractSigningContext | null> {
    const contract = await this.findByIdForClient(contractId, clientUserId)
    if (!contract) {
      return null
    }

    const pool = getPool()
    const userResult = await pool.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [clientUserId]
    )

    if (userResult.rows.length === 0) {
      return null
    }

    const firstName = String(userResult.rows[0].first_name ?? '').trim()
    const lastName = String(userResult.rows[0].last_name ?? '').trim()
    const accountLegalName = `${firstName} ${lastName}`.trim()

    if (!this.fileExists(contract.filePath)) {
      throw new Error('CONTRACT_FILE_MISSING')
    }

    const absolutePath = this.getAbsolutePath(contract.filePath)
    const pdfHash = await sha256File(absolutePath)

    return {
      contractId: contract.id,
      title: contract.title,
      pdfHash,
      suggestedLegalName: accountLegalName,
      accountLegalName,
      minViewSeconds: CONTRACT_MIN_VIEW_SECONDS,
      consentVersion: CONTRACT_CONSENT_VERSION,
      consentText: CONTRACT_CONSENT_TEXT,
      alreadyAcknowledged: !!contract.acknowledgedAt,
    }
  }

  static async acknowledge(
    contractId: number,
    clientUserId: number,
    acknowledgementIp: string | null,
    userAgent: string | null,
    input: IContractAcknowledgeInput
  ): Promise<IContractSummary | null> {
    const pool = getPool()

    const contract = await this.findByIdForClient(contractId, clientUserId)
    if (!contract) {
      return null
    }

    if (contract.acknowledgedAt) {
      return {
        id: contract.id,
        title: contract.title,
        fileName: contract.fileName,
        fileAvailable: this.fileExists(contract.filePath),
        acknowledgedAt: contract.acknowledgedAt,
        acknowledgementLegalName: contract.acknowledgementLegalName,
        createdAt: contract.createdAt,
      }
    }

    const legalName = input.legalName.trim().replace(/\s+/g, ' ')
    if (legalName.length < 2) {
      throw new Error('LEGAL_NAME_REQUIRED')
    }

    if (!input.consentAccepted) {
      throw new Error('CONSENT_REQUIRED')
    }

    if (!this.fileExists(contract.filePath)) {
      throw new Error('CONTRACT_FILE_MISSING')
    }

    const absolutePath = this.getAbsolutePath(contract.filePath)
    const serverPdfHash = await sha256File(absolutePath)
    if (input.pdfHash !== serverPdfHash) {
      throw new Error('PDF_HASH_MISMATCH')
    }

    const meetsViewRequirement =
      input.scrolledToEnd ||
      input.viewDurationSeconds >= CONTRACT_MIN_VIEW_SECONDS

    if (!meetsViewRequirement) {
      throw new Error('REVIEW_INCOMPLETE')
    }

    const userResult = await pool.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [clientUserId]
    )
    const firstName = String(userResult.rows[0]?.first_name ?? '').trim()
    const lastName = String(userResult.rows[0]?.last_name ?? '').trim()
    const accountLegalName = `${firstName} ${lastName}`.trim()

    const nameMatchesAccount =
      normalizeLegalName(legalName) === normalizeLegalName(accountLegalName)

    if (!nameMatchesAccount && !input.confirmLegalName) {
      throw new Error('LEGAL_NAME_CONFIRMATION_REQUIRED')
    }

    const result = await pool.query(
      `
      UPDATE contracts
      SET acknowledged_at = NOW(),
          acknowledged_by = $2,
          acknowledgement_ip = $3,
          acknowledgement_legal_name = $4,
          acknowledgement_user_agent = $5,
          acknowledgement_pdf_hash = $6,
          acknowledgement_view_seconds = $7,
          acknowledgement_scrolled_to_end = $8,
          acknowledgement_consent_version = $9,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, file_name, acknowledged_at, acknowledgement_legal_name, created_at
      `,
      [
        contractId,
        clientUserId,
        acknowledgementIp,
        legalName,
        userAgent,
        serverPdfHash,
        Math.max(0, Math.floor(input.viewDurationSeconds)),
        input.scrolledToEnd,
        CONTRACT_CONSENT_VERSION,
      ]
    )

    return mapSummaryRow(result.rows[0])
  }
}

export const Contract = ContractModel
