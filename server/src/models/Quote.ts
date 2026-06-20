import { getPool } from '../config/database'
import { Project } from './Project'
import { QuoteContract, type IQuoteContractSummary } from './QuoteContract'
import { formatDateOnly } from '../utils/dateOnly'

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'converted'

export interface IQuoteLineItem {
  id: number
  quoteId: number
  description: string
  quantity: number
  unitPrice: number
  amount: number
  sortOrder: number
}

export interface IQuote {
  id: number
  vendorId: number
  projectId: number | null
  token: string
  status: QuoteStatus
  title: string
  clientEmail: string
  clientName: string | null
  eventDate: string | null
  location: string | null
  notes: string | null
  currency: string
  totalAmount: number
  expiresAt: Date
  sentAt: Date | null
  respondedAt: Date | null
  createdAt: Date
  updatedAt: Date
  lineItems: IQuoteLineItem[]
  contract: IQuoteContractSummary | null
}

export interface IQuotePublicView {
  token: string
  status: QuoteStatus
  title: string
  clientEmail: string
  clientName: string | null
  eventDate: string | null
  location: string | null
  notes: string | null
  currency: string
  totalAmount: number
  expiresAt: Date
  vendorBusinessName: string
  lineItems: IQuoteLineItem[]
  canRespond: boolean
  contract: IQuoteContractSummary | null
}

export interface IQuoteCreateInput {
  title: string
  clientEmail: string
  clientName?: string
  eventDate?: string
  location?: string
  notes?: string
  currency?: string
  expiresInDays?: number
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
}

function mapLineItemRow(row: {
  id: number
  quote_id: number
  description: string
  quantity: string
  unit_price: string
  sort_order: number
}): IQuoteLineItem {
  const quantity = parseFloat(row.quantity)
  const unitPrice = parseFloat(row.unit_price)
  return {
    id: row.id,
    quoteId: row.quote_id,
    description: row.description,
    quantity,
    unitPrice,
    amount: quantity * unitPrice,
    sortOrder: row.sort_order,
  }
}

function computeTotal(lineItems: IQuoteLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.amount, 0)
}

async function loadLineItems(quoteId: number): Promise<IQuoteLineItem[]> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT id, quote_id, description, quantity, unit_price, sort_order
    FROM quote_line_items
    WHERE quote_id = $1
    ORDER BY sort_order ASC, id ASC
    `,
    [quoteId]
  )
  return result.rows.map(mapLineItemRow)
}

async function loadContractSummary(
  quoteId: number,
  quoteStatus: QuoteStatus
): Promise<IQuoteContractSummary | null> {
  const contract = await QuoteContract.findByQuoteId(quoteId)
  return QuoteContract.toSummary(contract, quoteStatus)
}

function mapQuoteRow(
  row: {
    id: number
    vendor_id: number
    project_id: number | null
    token: string
    status: QuoteStatus
    title: string
    client_email: string
    client_name: string | null
    wedding_date: Date | null
    location: string | null
    notes: string | null
    currency: string
    expires_at: Date
    sent_at: Date | null
    responded_at: Date | null
    created_at: Date
    updated_at: Date
  },
  lineItems: IQuoteLineItem[],
  contract: IQuoteContractSummary | null
): IQuote {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    projectId: row.project_id,
    token: row.token,
    status: row.status,
    title: row.title,
    clientEmail: row.client_email,
    clientName: row.client_name,
    eventDate: formatDateOnly(row.wedding_date),
    location: row.location,
    notes: row.notes,
    currency: row.currency,
    totalAmount: computeTotal(lineItems),
    expiresAt: row.expires_at,
    sentAt: row.sent_at,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lineItems,
    contract,
  }
}

export class QuoteModel {
  static isExpired(quote: { expiresAt: Date; status: QuoteStatus }): boolean {
    if (quote.status === 'expired') {
      return true
    }
    return new Date(quote.expiresAt) <= new Date()
  }

  static canClientRespond(quote: { status: QuoteStatus; expiresAt: Date }): boolean {
    if (quote.status !== 'sent') {
      return false
    }
    return !this.isExpired(quote)
  }

  static async findByVendorId(vendorId: number): Promise<IQuote[]> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT * FROM quotes
      WHERE vendor_id = $1
      ORDER BY created_at DESC
      `,
      [vendorId]
    )

    const quotes: IQuote[] = []
    for (const row of result.rows) {
      const lineItems = await loadLineItems(row.id)
      const contract = await loadContractSummary(row.id, row.status)
      quotes.push(mapQuoteRow(row, lineItems, contract))
    }
    return quotes
  }

  static async findVendorMetaByToken(
    token: string
  ): Promise<{ vendorId: number; quoteId: number; title: string; clientName: string | null } | null> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT id, vendor_id, title, client_name FROM quotes WHERE token = $1`,
      [token]
    )
    if (result.rows.length === 0) {
      return null
    }
    const row = result.rows[0]
    return {
      vendorId: row.vendor_id,
      quoteId: row.id,
      title: row.title,
      clientName: row.client_name,
    }
  }

  static async findByIdForVendor(id: number, vendorId: number): Promise<IQuote | null> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT * FROM quotes WHERE id = $1 AND vendor_id = $2`,
      [id, vendorId]
    )
    if (result.rows.length === 0) {
      return null
    }
    const lineItems = await loadLineItems(id)
    const contract = await loadContractSummary(id, result.rows[0].status)
    return mapQuoteRow(result.rows[0], lineItems, contract)
  }

  static async findByToken(token: string): Promise<IQuotePublicView | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT
        q.*,
        COALESCE(vp.business_name, u.first_name || ' ' || u.last_name) AS vendor_business_name
      FROM quotes q
      INNER JOIN users u ON u.id = q.vendor_id
      LEFT JOIN vendor_profiles vp ON vp.user_id = q.vendor_id
      WHERE q.token = $1
      `,
      [token]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    const lineItems = await loadLineItems(row.id)
    const status = this.isExpired(row) && row.status === 'sent' ? 'expired' : row.status
    const contract = await loadContractSummary(row.id, status)

    if (status === 'expired' && row.status === 'sent') {
      await pool.query(`UPDATE quotes SET status = 'expired', updated_at = NOW() WHERE id = $1`, [
        row.id,
      ])
    }

    return {
      token: row.token,
      status,
      title: row.title,
      clientEmail: row.client_email,
      clientName: row.client_name,
      eventDate: formatDateOnly(row.wedding_date),
      location: row.location,
      notes: row.notes,
      currency: row.currency,
      totalAmount: computeTotal(lineItems),
      expiresAt: row.expires_at,
      vendorBusinessName: row.vendor_business_name,
      lineItems,
      canRespond: status === 'sent' && !this.isExpired(row),
      contract,
    }
  }

  static async create(vendorId: number, input: IQuoteCreateInput): Promise<IQuote> {
    if (!input.lineItems.length) {
      throw new Error('LINE_ITEMS_REQUIRED')
    }

    const pool = getPool()
    const client = await pool.connect()
    const expiresInDays = input.expiresInDays ?? 14

    try {
      await client.query('BEGIN')

      const quoteResult = await client.query(
        `
        INSERT INTO quotes (
          vendor_id, title, client_email, client_name, wedding_date, location,
          notes, currency, expires_at, status, sent_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + ($9 || ' days')::INTERVAL, 'sent', NOW())
        RETURNING *
        `,
        [
          vendorId,
          input.title.trim(),
          input.clientEmail.toLowerCase().trim(),
          input.clientName?.trim() || null,
          input.eventDate ? formatDateOnly(input.eventDate) : null,
          input.location?.trim() || null,
          input.notes?.trim() || null,
          input.currency ?? 'USD',
          String(expiresInDays),
        ]
      )

      const quoteId = quoteResult.rows[0].id as number

      for (let i = 0; i < input.lineItems.length; i++) {
        const item = input.lineItems[i]
        if (!item) {
          continue
        }
        await client.query(
          `
          INSERT INTO quote_line_items (quote_id, description, quantity, unit_price, sort_order)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [quoteId, item.description.trim(), item.quantity, item.unitPrice, i + 1]
        )
      }

      await client.query('COMMIT')

      const quote = await this.findByIdForVendor(quoteId, vendorId)
      if (!quote) {
        throw new Error('QUOTE_CREATE_FAILED')
      }
      return quote
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  static async respondToQuote(
    token: string,
    decision: 'accepted' | 'declined'
  ): Promise<IQuotePublicView | null> {
    const pool = getPool()
    const existing = await this.findByToken(token)
    if (!existing || !existing.canRespond) {
      return null
    }

    const result = await pool.query(
      `
      UPDATE quotes
      SET status = $2, responded_at = NOW(), updated_at = NOW()
      WHERE token = $1 AND status = 'sent'
      RETURNING token
      `,
      [token, decision]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.findByToken(token)
  }

  static async convertToProject(
    quoteId: number,
    vendorId: number
  ): Promise<{ quote: IQuote; projectId: number }> {
    const quote = await this.findByIdForVendor(quoteId, vendorId)
    if (!quote) {
      throw new Error('QUOTE_NOT_FOUND')
    }
    if (quote.status !== 'accepted') {
      throw new Error('QUOTE_NOT_ACCEPTED')
    }
    if (quote.projectId) {
      throw new Error('QUOTE_ALREADY_CONVERTED')
    }

    const eventDate = formatDateOnly(quote.eventDate)

    const project = await Project.create(vendorId, {
      title: quote.title,
      ...(quote.clientName ? { clientDisplayName: quote.clientName } : {}),
      ...(eventDate ? { eventDate } : {}),
      ...(quote.location ? { location: quote.location } : {}),
      clientEmail: quote.clientEmail,
      status: 'inquiry',
      ...(quote.notes
        ? {
            internalNotes: `Converted from quote #${quote.id}. Total: ${quote.currency} ${quote.totalAmount.toFixed(2)}`,
          }
        : {}),
    })

    const pool = getPool()
    await pool.query(
      `
      UPDATE quotes
      SET project_id = $1, status = 'converted', updated_at = NOW()
      WHERE id = $2
      `,
      [project.id, quoteId]
    )

    await QuoteContract.copyToProject(quoteId, project.id, vendorId)

    const updated = await this.findByIdForVendor(quoteId, vendorId)
    if (!updated) {
      throw new Error('QUOTE_NOT_FOUND')
    }

    return { quote: updated, projectId: project.id }
  }
}

export const Quote = QuoteModel
