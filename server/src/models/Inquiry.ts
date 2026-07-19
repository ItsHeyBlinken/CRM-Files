import { getPool } from '../config/database'
import { formatDateOnly } from '../utils/dateOnly'
import { Quote } from './Quote'
import { QuotePackage } from './QuotePackage'

export type InquiryStatus = 'new' | 'contacted' | 'quote_sent' | 'booked' | 'lost'

export interface IInquiry {
  id: number
  vendorId: number
  name: string
  email: string
  phone: string | null
  serviceType: string | null
  eventDate: string | null
  budget: number | null
  notes: string | null
  status: InquiryStatus
  quoteId: number | null
  createdAt: Date
  updatedAt: Date
}

export interface IInquiryCreate {
  name: string
  email: string
  phone?: string | null
  serviceType?: string | null
  eventDate?: string | null
  budget?: number | null
  notes?: string | null
  status?: InquiryStatus
}

export interface IInquiryUpdate {
  name?: string
  email?: string
  phone?: string | null
  serviceType?: string | null
  eventDate?: string | null
  budget?: number | null
  notes?: string | null
  status?: InquiryStatus
  quoteId?: number | null
}

const VALID_STATUSES: InquiryStatus[] = ['new', 'contacted', 'quote_sent', 'booked', 'lost']

function mapRow(row: {
  id: number
  vendor_id: number
  name: string
  email: string
  phone: string | null
  service_type: string | null
  event_date: Date | string | null
  budget: string | number | null
  notes: string | null
  status: InquiryStatus
  quote_id: number | null
  created_at: Date
  updated_at: Date
}): IInquiry {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    serviceType: row.service_type,
    eventDate: formatDateOnly(row.event_date),
    budget: row.budget === null || row.budget === undefined ? null : Number(row.budget),
    notes: row.notes,
    status: row.status,
    quoteId: row.quote_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class InquiryModel {
  static isValidStatus(status: string): status is InquiryStatus {
    return VALID_STATUSES.includes(status as InquiryStatus)
  }

  static async findByVendorId(vendorId: number): Promise<IInquiry[]> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT * FROM inquiries
      WHERE vendor_id = $1
      ORDER BY
        CASE status
          WHEN 'new' THEN 0
          WHEN 'contacted' THEN 1
          WHEN 'quote_sent' THEN 2
          WHEN 'booked' THEN 3
          WHEN 'lost' THEN 4
          ELSE 5
        END,
        created_at DESC
      `,
      [vendorId]
    )
    return result.rows.map(mapRow)
  }

  static async findByIdForVendor(id: number, vendorId: number): Promise<IInquiry | null> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT * FROM inquiries WHERE id = $1 AND vendor_id = $2`,
      [id, vendorId]
    )
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null
  }

  static async create(vendorId: number, data: IInquiryCreate): Promise<IInquiry> {
    const pool = getPool()
    const status = data.status && this.isValidStatus(data.status) ? data.status : 'new'
    const result = await pool.query(
      `
      INSERT INTO inquiries (
        vendor_id, name, email, phone, service_type, event_date, budget, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        vendorId,
        data.name.trim(),
        data.email.toLowerCase().trim(),
        data.phone?.trim() || null,
        data.serviceType?.trim() || null,
        formatDateOnly(data.eventDate),
        data.budget ?? null,
        data.notes?.trim() || null,
        status,
      ]
    )
    return mapRow(result.rows[0])
  }

  static async update(
    id: number,
    vendorId: number,
    data: IInquiryUpdate
  ): Promise<IInquiry | null> {
    const existing = await this.findByIdForVendor(id, vendorId)
    if (!existing) {
      return null
    }

    if (data.status !== undefined && !this.isValidStatus(data.status)) {
      throw new Error('INVALID_STATUS')
    }

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE inquiries SET
        name = COALESCE($3, name),
        email = COALESCE($4, email),
        phone = CASE WHEN $5::boolean THEN $6 ELSE phone END,
        service_type = CASE WHEN $7::boolean THEN $8 ELSE service_type END,
        event_date = CASE WHEN $9::boolean THEN $10::date ELSE event_date END,
        budget = CASE WHEN $11::boolean THEN $12 ELSE budget END,
        notes = CASE WHEN $13::boolean THEN $14 ELSE notes END,
        status = COALESCE($15, status),
        quote_id = CASE WHEN $16::boolean THEN $17 ELSE quote_id END,
        updated_at = NOW()
      WHERE id = $1 AND vendor_id = $2
      RETURNING *
      `,
      [
        id,
        vendorId,
        data.name?.trim() ?? null,
        data.email !== undefined ? data.email.toLowerCase().trim() : null,
        data.phone !== undefined,
        data.phone === undefined ? null : data.phone?.trim() || null,
        data.serviceType !== undefined,
        data.serviceType === undefined ? null : data.serviceType?.trim() || null,
        data.eventDate !== undefined,
        data.eventDate === undefined ? null : formatDateOnly(data.eventDate),
        data.budget !== undefined,
        data.budget === undefined ? null : data.budget,
        data.notes !== undefined,
        data.notes === undefined ? null : data.notes?.trim() || null,
        data.status ?? null,
        data.quoteId !== undefined,
        data.quoteId === undefined ? null : data.quoteId,
      ]
    )
    if (result.rows.length === 0) {
      return null
    }

    const updated = mapRow(result.rows[0])

    // Marking lost closes the linked open quote (and backfills any other lost→sent orphans).
    if (data.status === 'lost') {
      await Quote.declineOpenLinkedToLostInquiries(vendorId)
    }

    return updated
  }

  static async linkQuote(
    inquiryId: number,
    vendorId: number,
    quoteId: number
  ): Promise<IInquiry | null> {
    return this.update(inquiryId, vendorId, {
      quoteId,
      status: 'quote_sent',
    })
  }

  static async markBookedByQuoteId(quoteId: number, vendorId: number): Promise<void> {
    const pool = getPool()
    await pool.query(
      `
      UPDATE inquiries
      SET status = 'booked', updated_at = NOW()
      WHERE quote_id = $1 AND vendor_id = $2 AND status != 'lost'
      `,
      [quoteId, vendorId]
    )
  }

  static async createQuoteFromInquiry(
    inquiryId: number,
    vendorId: number,
    options?: {
      title?: string
      lineItems?: Array<{ description: string; quantity: number; unitPrice: number }>
      packageId?: number
    }
  ): Promise<{ inquiry: IInquiry; quote: Awaited<ReturnType<typeof Quote.create>> }> {
    const inquiry = await this.findByIdForVendor(inquiryId, vendorId)
    if (!inquiry) {
      throw new Error('INQUIRY_NOT_FOUND')
    }

    let lineItems = options?.lineItems
    if ((!lineItems || lineItems.length === 0) && options?.packageId) {
      const pkg = await QuotePackage.findByIdForVendor(options.packageId, vendorId)
      if (!pkg) {
        throw new Error('PACKAGE_NOT_FOUND')
      }
      lineItems = pkg.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    }

    if (!lineItems || lineItems.length === 0) {
      // Budget on the inquiry is reference only — never lock it as the quote price.
      lineItems = [
        {
          description: inquiry.serviceType?.trim() || 'Services',
          quantity: 1,
          unitPrice: 0,
        },
      ]
    }

    const title =
      options?.title?.trim() ||
      `${inquiry.name} — ${inquiry.serviceType?.trim() || 'Event'}`

    const noteParts: string[] = []
    if (inquiry.budget != null && inquiry.budget > 0) {
      noteParts.push(`Client budget (reference only): $${inquiry.budget.toLocaleString()}`)
    }
    if (inquiry.notes?.trim()) {
      noteParts.push(inquiry.notes.trim())
    }

    const quote = await Quote.create(vendorId, {
      title,
      clientEmail: inquiry.email,
      clientName: inquiry.name,
      ...(inquiry.eventDate ? { eventDate: inquiry.eventDate } : {}),
      ...(noteParts.length > 0 ? { notes: noteParts.join('\n\n') } : {}),
      lineItems,
    })

    const updated = await this.linkQuote(inquiryId, vendorId, quote.id)
    if (!updated) {
      throw new Error('INQUIRY_NOT_FOUND')
    }

    return { inquiry: updated, quote }
  }
}

export const Inquiry = InquiryModel
