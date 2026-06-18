import path from 'path'
import { getPool } from '../config/database'

export interface IDeliverable {
  id: number
  projectId: number
  title: string
  description: string | null
  filePath: string
  fileName: string
  fileSizeBytes: number | null
  mimeType: string | null
  clientVisible: boolean
  uploadedBy: number
  createdAt: Date
  updatedAt: Date
}

export interface IDeliverableSummary {
  id: number
  title: string
  fileName: string
  fileSizeBytes: number | null
  clientVisible: boolean
  createdAt: Date
}

function mapDeliverableRow(row: {
  id: number
  project_id: number
  title: string
  description: string | null
  file_path: string
  file_name: string
  file_size_bytes: number | null
  mime_type: string | null
  client_visible: boolean
  uploaded_by: number
  created_at: Date
  updated_at: Date
}): IDeliverable {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    mimeType: row.mime_type,
    clientVisible: row.client_visible,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSummaryRow(row: {
  id: number
  title: string
  file_name: string
  file_size_bytes: number | null
  client_visible: boolean
  created_at: Date
}): IDeliverableSummary {
  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    clientVisible: row.client_visible,
    createdAt: row.created_at,
  }
}

export class DeliverableModel {
  static getAbsolutePath(relativePath: string): string {
    return path.join(process.cwd(), 'uploads', relativePath)
  }

  static async findByProjectForVendor(
    projectId: number,
    vendorId: number
  ): Promise<IDeliverableSummary[]> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT d.id, d.title, d.file_name, d.file_size_bytes, d.client_visible, d.created_at
      FROM deliverables d
      INNER JOIN projects p ON p.id = d.project_id
      WHERE d.project_id = $1 AND p.vendor_id = $2
      ORDER BY d.id DESC
      `,
      [projectId, vendorId]
    )

    return result.rows.map(mapSummaryRow)
  }

  static async create(
    projectId: number,
    vendorId: number,
    data: {
      title: string
      description?: string | null
      relativeFilePath: string
      fileName: string
      fileSizeBytes: number
      mimeType: string | null
      clientVisible?: boolean
    }
  ): Promise<IDeliverableSummary> {
    const pool = getPool()

    const projectCheck = await pool.query(
      `SELECT id FROM projects WHERE id = $1 AND vendor_id = $2`,
      [projectId, vendorId]
    )

    if (projectCheck.rows.length === 0) {
      throw new Error('PROJECT_NOT_FOUND')
    }

    const result = await pool.query(
      `
      INSERT INTO deliverables (
        project_id, title, description, file_path, file_name,
        file_size_bytes, mime_type, client_visible, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, title, file_name, file_size_bytes, client_visible, created_at
      `,
      [
        projectId,
        data.title,
        data.description ?? null,
        data.relativeFilePath,
        data.fileName,
        data.fileSizeBytes,
        data.mimeType,
        data.clientVisible ?? true,
        vendorId,
      ]
    )

    return mapSummaryRow(result.rows[0])
  }

  static async findByIdForClient(
    deliverableId: number,
    clientUserId: number
  ): Promise<IDeliverable | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT d.*
      FROM deliverables d
      INNER JOIN project_clients pc ON pc.project_id = d.project_id
      WHERE d.id = $1 AND pc.client_user_id = $2 AND d.client_visible = true
      LIMIT 1
      `,
      [deliverableId, clientUserId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return mapDeliverableRow(result.rows[0])
  }
}

export const Deliverable = DeliverableModel
