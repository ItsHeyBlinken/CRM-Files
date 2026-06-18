import { getPool } from '../config/database'
import { formatDateOnly } from '../utils/dateOnly'
import { Project } from './Project'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'stripe' | 'venmo' | 'zelle' | 'cashapp' | 'paypal' | 'manual'

export interface IInvoice {
  id: number
  projectId: number
  invoiceNumber: string | null
  title: string
  description: string | null
  amount: number
  currency: string
  dueDate: string | null
  status: InvoiceStatus
  notes: string | null
  paidAt: Date | null
  paymentMethod: PaymentMethod | null
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  clientPaymentClaimedAt: Date | null
  clientPaymentNote: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IInvoiceCreate {
  title: string
  invoiceNumber?: string | null
  description?: string | null
  amount: number
  currency?: string
  dueDate?: string | null
  status?: InvoiceStatus
  notes?: string | null
}

export interface IInvoiceUpdate {
  title?: string
  invoiceNumber?: string | null
  description?: string | null
  amount?: number
  currency?: string
  dueDate?: string | null
  status?: InvoiceStatus
  notes?: string | null
}

function mapInvoiceRow(row: {
  id: number
  project_id: number
  invoice_number: string | null
  title: string
  description: string | null
  amount: string | number
  currency: string
  due_date: Date | string | null
  status: InvoiceStatus
  notes: string | null
  paid_at: Date | null
  payment_method: PaymentMethod | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  client_payment_claimed_at: Date | null
  client_payment_note: string | null
  created_at: Date
  updated_at: Date
}): IInvoice {
  return {
    id: row.id,
    projectId: row.project_id,
    invoiceNumber: row.invoice_number,
    title: row.title,
    description: row.description,
    amount: parseFloat(String(row.amount)),
    currency: row.currency,
    dueDate: formatDateOnly(row.due_date),
    status: row.status,
    notes: row.notes,
    paidAt: row.paid_at,
    paymentMethod: row.payment_method,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    clientPaymentClaimedAt: row.client_payment_claimed_at,
    clientPaymentNote: row.client_payment_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class InvoiceModel {
  static async findByProjectForVendor(
    projectId: number,
    vendorId: number
  ): Promise<IInvoice[]> {
    const project = await Project.findByIdForVendor(projectId, vendorId)
    if (!project) {
      return []
    }

    const pool = getPool()
    const result = await pool.query(
      `
      SELECT * FROM invoices
      WHERE project_id = $1
      ORDER BY due_date ASC NULLS LAST, id ASC
      `,
      [projectId]
    )
    return result.rows.map(mapInvoiceRow)
  }

  static async findByIdForVendor(
    invoiceId: number,
    projectId: number,
    vendorId: number
  ): Promise<IInvoice | null> {
    const project = await Project.findByIdForVendor(projectId, vendorId)
    if (!project) {
      return null
    }

    const pool = getPool()
    const result = await pool.query(
      `SELECT * FROM invoices WHERE id = $1 AND project_id = $2`,
      [invoiceId, projectId]
    )
    return result.rows.length > 0 ? mapInvoiceRow(result.rows[0]) : null
  }

  static async findByIdForClient(
    invoiceId: number,
    clientUserId: number
  ): Promise<IInvoice | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT i.*
      FROM invoices i
      INNER JOIN project_clients pc ON pc.project_id = i.project_id
      WHERE i.id = $1 AND pc.client_user_id = $2 AND i.status != 'draft'
      `,
      [invoiceId, clientUserId]
    )
    return result.rows.length > 0 ? mapInvoiceRow(result.rows[0]) : null
  }

  static async findByCheckoutSessionId(sessionId: string): Promise<IInvoice | null> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT * FROM invoices WHERE stripe_checkout_session_id = $1`,
      [sessionId]
    )
    return result.rows.length > 0 ? mapInvoiceRow(result.rows[0]) : null
  }

  static async create(
    projectId: number,
    vendorId: number,
    data: IInvoiceCreate
  ): Promise<IInvoice> {
    const project = await Project.findByIdForVendor(projectId, vendorId)
    if (!project) {
      throw new Error('PROJECT_NOT_FOUND')
    }

    if (!data.title?.trim()) {
      throw new Error('TITLE_REQUIRED')
    }

    if (typeof data.amount !== 'number' || data.amount < 0) {
      throw new Error('INVALID_AMOUNT')
    }

    const pool = getPool()
    const result = await pool.query(
      `
      INSERT INTO invoices (
        project_id, invoice_number, title, description, amount, currency,
        due_date, status, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        projectId,
        data.invoiceNumber?.trim() || null,
        data.title.trim(),
        data.description?.trim() || null,
        data.amount,
        (data.currency || 'USD').toUpperCase(),
        formatDateOnly(data.dueDate),
        data.status || 'draft',
        data.notes?.trim() || null,
        vendorId,
      ]
    )
    return mapInvoiceRow(result.rows[0])
  }

  static async update(
    invoiceId: number,
    projectId: number,
    vendorId: number,
    data: IInvoiceUpdate
  ): Promise<IInvoice | null> {
    const existing = await this.findByIdForVendor(invoiceId, projectId, vendorId)
    if (!existing) {
      return null
    }

    if (existing.status === 'paid') {
      throw new Error('INVOICE_ALREADY_PAID')
    }

    const fields: string[] = []
    const values: unknown[] = []
    let param = 1

    const setField = (column: string, value: unknown) => {
      fields.push(`${column} = $${param++}`)
      values.push(value)
    }

    if (data.title !== undefined) setField('title', data.title.trim())
    if (data.invoiceNumber !== undefined) {
      setField('invoice_number', data.invoiceNumber?.trim() || null)
    }
    if (data.description !== undefined) {
      setField('description', data.description?.trim() || null)
    }
    if (data.amount !== undefined) {
      if (typeof data.amount !== 'number' || data.amount < 0) {
        throw new Error('INVALID_AMOUNT')
      }
      setField('amount', data.amount)
    }
    if (data.currency !== undefined) setField('currency', data.currency.toUpperCase())
    if (data.dueDate !== undefined) setField('due_date', formatDateOnly(data.dueDate))
    if (data.status !== undefined) setField('status', data.status)
    if (data.notes !== undefined) setField('notes', data.notes?.trim() || null)

    if (fields.length === 0) {
      return existing
    }

    fields.push('updated_at = NOW()')
    values.push(invoiceId, projectId)

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE invoices SET ${fields.join(', ')}
      WHERE id = $${param++} AND project_id = $${param}
      RETURNING *
      `,
      values
    )
    return result.rows.length > 0 ? mapInvoiceRow(result.rows[0]) : null
  }

  static async delete(
    invoiceId: number,
    projectId: number,
    vendorId: number
  ): Promise<boolean> {
    const existing = await this.findByIdForVendor(invoiceId, projectId, vendorId)
    if (!existing) {
      return false
    }

    if (existing.status === 'paid') {
      throw new Error('INVOICE_ALREADY_PAID')
    }

    const pool = getPool()
    const result = await pool.query(
      `DELETE FROM invoices WHERE id = $1 AND project_id = $2`,
      [invoiceId, projectId]
    )
    return (result.rowCount ?? 0) > 0
  }

  static async sendToClient(
    invoiceId: number,
    projectId: number,
    vendorId: number
  ): Promise<IInvoice | null> {
    const existing = await this.findByIdForVendor(invoiceId, projectId, vendorId)
    if (!existing) {
      return null
    }

    if (existing.status === 'paid' || existing.status === 'cancelled') {
      throw new Error('INVALID_STATUS_TRANSITION')
    }

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE invoices SET status = 'sent', updated_at = NOW()
      WHERE id = $1 AND project_id = $2
      RETURNING *
      `,
      [invoiceId, projectId]
    )
    return result.rows.length > 0 ? mapInvoiceRow(result.rows[0]) : null
  }

  static async markPaid(
    invoiceId: number,
    projectId: number,
    vendorId: number,
    paymentMethod: PaymentMethod = 'manual'
  ): Promise<IInvoice | null> {
    const existing = await this.findByIdForVendor(invoiceId, projectId, vendorId)
    if (!existing) {
      return null
    }

    if (existing.status === 'paid') {
      return existing
    }

    if (existing.status === 'cancelled') {
      throw new Error('INVALID_STATUS_TRANSITION')
    }

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE invoices
      SET status = 'paid', paid_at = NOW(), payment_method = $3, updated_at = NOW()
      WHERE id = $1 AND project_id = $2
      RETURNING *
      `,
      [invoiceId, projectId, paymentMethod]
    )
    return result.rows.length > 0 ? mapInvoiceRow(result.rows[0]) : null
  }

  static async claimClientPayment(
    invoiceId: number,
    clientUserId: number,
    note?: string | null
  ): Promise<IInvoice | null> {
    const existing = await this.findByIdForClient(invoiceId, clientUserId)
    if (!existing) {
      return null
    }

    if (existing.status === 'paid' || existing.status === 'cancelled') {
      throw new Error('INVALID_STATUS_TRANSITION')
    }

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE invoices
      SET client_payment_claimed_at = NOW(),
          client_payment_note = $3,
          updated_at = NOW()
      WHERE id = $1 AND project_id = $2
      RETURNING *
      `,
      [invoiceId, existing.projectId, note?.trim() || null]
    )
    return result.rows.length > 0 ? mapInvoiceRow(result.rows[0]) : null
  }

  static async markPaidFromStripe(
    invoiceId: number,
    sessionId: string,
    paymentIntentId: string | null
  ): Promise<IInvoice | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE invoices
      SET status = 'paid',
          paid_at = NOW(),
          payment_method = 'stripe',
          stripe_checkout_session_id = $2,
          stripe_payment_intent_id = $3,
          updated_at = NOW()
      WHERE id = $1 AND status != 'paid'
      RETURNING *
      `,
      [invoiceId, sessionId, paymentIntentId]
    )
    return result.rows.length > 0 ? mapInvoiceRow(result.rows[0]) : null
  }

  static async setCheckoutSessionId(invoiceId: number, sessionId: string): Promise<void> {
    const pool = getPool()
    await pool.query(
      `
      UPDATE invoices SET stripe_checkout_session_id = $2, updated_at = NOW()
      WHERE id = $1
      `,
      [invoiceId, sessionId]
    )
  }
}

export const Invoice = InvoiceModel
