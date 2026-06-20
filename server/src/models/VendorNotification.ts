import { getPool } from '../config/database'
import { emitVendorRealtimeEvent } from '../services/realtimeNotifications'

export type VendorNotificationType =
  | 'quote_accepted'
  | 'quote_declined'
  | 'quote_contract_signed'
  | 'client_joined'
  | 'invoice_payment_claimed'
  | 'invoice_paid'

export interface IVendorNotification {
  id: number
  vendorId: number
  type: VendorNotificationType
  title: string
  body: string | null
  linkPath: string | null
  readAt: Date | null
  createdAt: Date
}

export interface IVendorNotificationCreateInput {
  vendorId: number
  type: VendorNotificationType
  title: string
  body?: string | null
  linkPath?: string | null
}

function mapRow(row: {
  id: number
  vendor_id: number
  type: VendorNotificationType
  title: string
  body: string | null
  link_path: string | null
  read_at: Date | null
  created_at: Date
}): IVendorNotification {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkPath: row.link_path,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

export class VendorNotificationModel {
  static async create(input: IVendorNotificationCreateInput): Promise<IVendorNotification> {
    const pool = getPool()
    const result = await pool.query(
      `
      INSERT INTO vendor_notifications (vendor_id, type, title, body, link_path)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        input.vendorId,
        input.type,
        input.title.trim(),
        input.body?.trim() || null,
        input.linkPath || null,
      ]
    )

    const notification = mapRow(result.rows[0])
    const unreadCount = await this.getUnreadCount(input.vendorId)
    emitVendorRealtimeEvent(input.vendorId, 'vendor:notification', { notification, unreadCount })
    return notification
  }

  static async listForVendor(vendorId: number, limit = 20): Promise<IVendorNotification[]> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT * FROM vendor_notifications
      WHERE vendor_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [vendorId, limit]
    )
    return result.rows.map(mapRow)
  }

  static async getUnreadCount(vendorId: number): Promise<number> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM vendor_notifications
      WHERE vendor_id = $1 AND read_at IS NULL
      `,
      [vendorId]
    )
    return result.rows[0]?.count ?? 0
  }

  static async markRead(notificationId: number, vendorId: number): Promise<IVendorNotification | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE vendor_notifications
      SET read_at = NOW()
      WHERE id = $1 AND vendor_id = $2 AND read_at IS NULL
      RETURNING *
      `,
      [notificationId, vendorId]
    )
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null
  }

  static async markAllRead(vendorId: number): Promise<number> {
    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE vendor_notifications
      SET read_at = NOW()
      WHERE vendor_id = $1 AND read_at IS NULL
      RETURNING id
      `,
      [vendorId]
    )
    return result.rows.length
  }
}

export const VendorNotification = VendorNotificationModel
