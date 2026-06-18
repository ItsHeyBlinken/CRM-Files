import path from 'path'
import { getPool } from '../config/database'

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
  createdAt: Date
  updatedAt: Date
}

export interface IContractSummary {
  id: number
  title: string
  fileName: string
  acknowledgedAt: Date | null
  createdAt: Date
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSummaryRow(row: {
  id: number
  title: string
  file_name: string
  acknowledged_at: Date | null
  created_at: Date
}): IContractSummary {
  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
  }
}

export class ContractModel {
  static getAbsolutePath(relativePath: string): string {
    return path.join(process.cwd(), 'uploads', relativePath)
  }

  static async findByProjectForVendor(
    projectId: number,
    vendorId: number
  ): Promise<IContractSummary[]> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT c.id, c.title, c.file_name, c.acknowledged_at, c.created_at
      FROM contracts c
      INNER JOIN projects p ON p.id = c.project_id
      WHERE c.project_id = $1 AND p.vendor_id = $2
      ORDER BY c.id ASC
      `,
      [projectId, vendorId]
    )

    return result.rows.map(mapSummaryRow)
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
      RETURNING id, title, file_name, acknowledged_at, created_at
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

  static async acknowledge(
    contractId: number,
    clientUserId: number,
    acknowledgementIp: string | null
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
        acknowledgedAt: contract.acknowledgedAt,
        createdAt: contract.createdAt,
      }
    }

    const result = await pool.query(
      `
      UPDATE contracts
      SET acknowledged_at = NOW(),
          acknowledged_by = $2,
          acknowledgement_ip = $3,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, file_name, acknowledged_at, created_at
      `,
      [contractId, clientUserId, acknowledgementIp]
    )

    return mapSummaryRow(result.rows[0])
  }
}

export const Contract = ContractModel
