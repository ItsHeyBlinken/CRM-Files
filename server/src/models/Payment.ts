/**
 * Payment Model and Database Operations
 * 
 * This module defines the Payment model for the Event Planner CRM platform,
 * including payment tracking, invoicing, and financial management.
 * 
 * Features:
 * - Payment creation and tracking
 * - Payment status management (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
 * - Invoice generation and management
 * - Payment methods (CREDIT_CARD, BANK_TRANSFER, CASH, CHECK, OTHER)
 * - Recurring payment support
 * - Payment history and reporting
 * - Integration with events and vendors
 * 
 * @author Event Planner CRM Team
 * @version 1.0.0
 */

import { query } from '../config/database'

export interface IPayment {
  id: string
  eventId: string
  vendorId?: string
  clientId: string
  amount: number
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'OTHER'
  paymentType: 'DEPOSIT' | 'FINAL_PAYMENT' | 'INSTALLMENT' | 'FULL_PAYMENT' | 'REFUND'
  description?: string
  notes?: string
  dueDate?: Date
  paidDate?: Date
  invoiceNumber?: string
  transactionId?: string
  referenceNumber?: string
  isRecurring: boolean
  recurringDetails?: {
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    interval: number
    endDate?: Date
    nextPaymentDate?: Date
  }
  metadata?: {
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

export interface IPaymentCreate {
  eventId: string
  vendorId?: string
  clientId: string
  amount: number
  currency?: string
  paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'OTHER'
  paymentType: 'DEPOSIT' | 'FINAL_PAYMENT' | 'INSTALLMENT' | 'FULL_PAYMENT' | 'REFUND'
  description?: string
  notes?: string
  dueDate?: Date
  invoiceNumber?: string
  transactionId?: string
  referenceNumber?: string
  isRecurring?: boolean
  recurringDetails?: {
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    interval: number
    endDate?: Date
    nextPaymentDate?: Date
  }
  metadata?: {
    [key: string]: any
  }
}

export interface IPaymentUpdate {
  amount?: number
  currency?: string
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  paymentMethod?: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'OTHER'
  paymentType?: 'DEPOSIT' | 'FINAL_PAYMENT' | 'INSTALLMENT' | 'FULL_PAYMENT' | 'REFUND'
  description?: string
  notes?: string
  dueDate?: Date
  paidDate?: Date
  invoiceNumber?: string
  transactionId?: string
  referenceNumber?: string
  isRecurring?: boolean
  recurringDetails?: {
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    interval: number
    endDate?: Date
    nextPaymentDate?: Date
  }
  metadata?: {
    [key: string]: any
  }
}

export class PaymentModel {
  // Create a new payment
  static async create(paymentData: IPaymentCreate): Promise<IPayment> {
    const result = await query(`
      INSERT INTO payments (
        event_id, vendor_id, client_id, amount, currency, status, payment_method, payment_type,
        description, notes, due_date, invoice_number, transaction_id, reference_number,
        is_recurring, recurring_details, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING *
    `, [
      paymentData.eventId,
      paymentData.vendorId || null,
      paymentData.clientId,
      paymentData.amount,
      paymentData.currency || 'USD',
      'PENDING',
      paymentData.paymentMethod,
      paymentData.paymentType,
      paymentData.description || null,
      paymentData.notes || null,
      paymentData.dueDate || null,
      paymentData.invoiceNumber || null,
      paymentData.transactionId || null,
      paymentData.referenceNumber || null,
      paymentData.isRecurring || false,
      paymentData.recurringDetails ? JSON.stringify(paymentData.recurringDetails) : null,
      paymentData.metadata ? JSON.stringify(paymentData.metadata) : null
    ])

    return this.mapRowToPayment(result.rows[0])
  }

  // Find payment by ID
  static async findById(id: string): Promise<IPayment | null> {
    const result = await query('SELECT * FROM payments WHERE id = $1', [id])
    return result.rows.length > 0 ? this.mapRowToPayment(result.rows[0]) : null
  }

  // Find payments by event ID
  static async findByEventId(eventId: string): Promise<IPayment[]> {
    const result = await query('SELECT * FROM payments WHERE event_id = $1 ORDER BY created_at DESC', [eventId])
    return result.rows.map((row: any) => this.mapRowToPayment(row))
  }

  // Find payments by client ID
  static async findByClientId(clientId: string): Promise<IPayment[]> {
    const result = await query('SELECT * FROM payments WHERE client_id = $1 ORDER BY created_at DESC', [clientId])
    return result.rows.map((row: any) => this.mapRowToPayment(row))
  }

  // Find payments by vendor ID
  static async findByVendorId(vendorId: string): Promise<IPayment[]> {
    const result = await query('SELECT * FROM payments WHERE vendor_id = $1 ORDER BY created_at DESC', [vendorId])
    return result.rows.map((row: any) => this.mapRowToPayment(row))
  }

  // Find payments by status
  static async findByStatus(status: string): Promise<IPayment[]> {
    const result = await query('SELECT * FROM payments WHERE status = $1 ORDER BY created_at DESC', [status])
    return result.rows.map((row: any) => this.mapRowToPayment(row))
  }

  // Find overdue payments
  static async findOverdue(): Promise<IPayment[]> {
    const result = await query(`
      SELECT * FROM payments 
      WHERE status IN ('PENDING', 'PROCESSING') 
      AND due_date < NOW() 
      ORDER BY due_date ASC
    `)
    return result.rows.map((row: any) => this.mapRowToPayment(row))
  }

  // Find upcoming payments
  static async findUpcoming(days: number = 7): Promise<IPayment[]> {
    const result = await query(`
      SELECT * FROM payments 
      WHERE status IN ('PENDING', 'PROCESSING') 
      AND due_date BETWEEN NOW() AND NOW() + INTERVAL '${days} days'
      ORDER BY due_date ASC
    `)
    return result.rows.map((row: any) => this.mapRowToPayment(row))
  }

  // Update payment
  static async update(id: string, paymentData: IPaymentUpdate): Promise<IPayment | null> {
    const fields = []
    const values = []
    let paramCount = 1

    if (paymentData.amount !== undefined) {
      fields.push(`amount = $${paramCount++}`)
      values.push(paymentData.amount)
    }
    if (paymentData.currency !== undefined) {
      fields.push(`currency = $${paramCount++}`)
      values.push(paymentData.currency)
    }
    if (paymentData.status !== undefined) {
      fields.push(`status = $${paramCount++}`)
      values.push(paymentData.status)
      
      // Set paid_date when status changes to COMPLETED
      if (paymentData.status === 'COMPLETED' && !paymentData.paidDate) {
        fields.push(`paid_date = NOW()`)
      }
    }
    if (paymentData.paymentMethod !== undefined) {
      fields.push(`payment_method = $${paramCount++}`)
      values.push(paymentData.paymentMethod)
    }
    if (paymentData.paymentType !== undefined) {
      fields.push(`payment_type = $${paramCount++}`)
      values.push(paymentData.paymentType)
    }
    if (paymentData.description !== undefined) {
      fields.push(`description = $${paramCount++}`)
      values.push(paymentData.description)
    }
    if (paymentData.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`)
      values.push(paymentData.notes)
    }
    if (paymentData.dueDate !== undefined) {
      fields.push(`due_date = $${paramCount++}`)
      values.push(paymentData.dueDate)
    }
    if (paymentData.paidDate !== undefined) {
      fields.push(`paid_date = $${paramCount++}`)
      values.push(paymentData.paidDate)
    }
    if (paymentData.invoiceNumber !== undefined) {
      fields.push(`invoice_number = $${paramCount++}`)
      values.push(paymentData.invoiceNumber)
    }
    if (paymentData.transactionId !== undefined) {
      fields.push(`transaction_id = $${paramCount++}`)
      values.push(paymentData.transactionId)
    }
    if (paymentData.referenceNumber !== undefined) {
      fields.push(`reference_number = $${paramCount++}`)
      values.push(paymentData.referenceNumber)
    }
    if (paymentData.isRecurring !== undefined) {
      fields.push(`is_recurring = $${paramCount++}`)
      values.push(paymentData.isRecurring)
    }
    if (paymentData.recurringDetails !== undefined) {
      fields.push(`recurring_details = $${paramCount++}`)
      values.push(JSON.stringify(paymentData.recurringDetails))
    }
    if (paymentData.metadata !== undefined) {
      fields.push(`metadata = $${paramCount++}`)
      values.push(JSON.stringify(paymentData.metadata))
    }

    if (fields.length === 0) {
      return this.findById(id)
    }

    fields.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(`
      UPDATE payments 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values)

    return result.rows.length > 0 ? this.mapRowToPayment(result.rows[0]) : null
  }

  // Delete payment
  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM payments WHERE id = $1', [id])
    return result.rowCount > 0
  }

  // Get payment statistics
  static async getStats(eventId?: string, clientId?: string): Promise<{
    total: number
    totalAmount: number
    pending: number
    completed: number
    failed: number
    refunded: number
    overdue: number
    byStatus: { [key: string]: number }
    byPaymentMethod: { [key: string]: number }
  }> {
    let whereClause = ''
    const params: any[] = []
    
    if (eventId) {
      whereClause = 'WHERE event_id = $1'
      params.push(eventId)
    } else if (clientId) {
      whereClause = 'WHERE client_id = $1'
      params.push(clientId)
    }

    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) as refunded,
        COUNT(CASE WHEN status IN ('PENDING', 'PROCESSING') AND due_date < NOW() THEN 1 END) as overdue
      FROM payments ${whereClause}
    `, params)

    const statusResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM payments ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `, params)

    const methodResult = await query(`
      SELECT 
        payment_method,
        COUNT(*) as count
      FROM payments ${whereClause}
      GROUP BY payment_method
      ORDER BY count DESC
    `, params)

    const byStatus: { [key: string]: number } = {}
    statusResult.rows.forEach((row: any) => {
      byStatus[row.status] = parseInt(row.count)
    })

    const byPaymentMethod: { [key: string]: number } = {}
    methodResult.rows.forEach((row: any) => {
      byPaymentMethod[row.payment_method] = parseInt(row.count)
    })

    const row = result.rows[0]
    return {
      total: parseInt(row.total),
      totalAmount: parseFloat(row.total_amount),
      pending: parseInt(row.pending),
      completed: parseInt(row.completed),
      failed: parseInt(row.failed),
      refunded: parseInt(row.refunded),
      overdue: parseInt(row.overdue),
      byStatus,
      byPaymentMethod
    }
  }

  // Map database row to Payment object
  private static mapRowToPayment(row: any): IPayment {
    return {
      id: row.id,
      eventId: row.event_id,
      vendorId: row.vendor_id,
      clientId: row.client_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      paymentMethod: row.payment_method,
      paymentType: row.payment_type,
      description: row.description,
      notes: row.notes,
      dueDate: row.due_date,
      paidDate: row.paid_date,
      invoiceNumber: row.invoice_number,
      transactionId: row.transaction_id,
      referenceNumber: row.reference_number,
      isRecurring: row.is_recurring,
      recurringDetails: row.recurring_details || undefined,
      metadata: row.metadata || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export const Payment = PaymentModel
