import { getPool } from '../config/database'
import { Contract } from './Contract'
import { Deliverable } from './Deliverable'
import {
  ProjectPaymentSettings,
  type IProjectPaymentSettings,
} from './ProjectPaymentSettings'
import { VendorPaymentSettings } from './VendorPaymentSettings'
import { formatDateOnly } from '../utils/dateOnly'
import {
  summarizeProjectPayments,
  type InvoiceKind,
  type ProjectPaymentSummary,
} from '../utils/projectPaymentSummary'

export type ProjectStatus =
  | 'inquiry'
  | 'booked'
  | 'in_progress'
  | 'delivered'
  | 'complete'
  | 'cancelled'

export interface IProject {
  id: number
  vendorId: number
  title: string
  description: string | null
  eventDate: string | null
  location: string | null
  status: ProjectStatus
  clientDisplayName: string | null
  clientEmail: string | null
  internalNotes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IProjectCreate {
  title: string
  description?: string
  eventDate?: string
  location?: string
  status?: ProjectStatus
  clientDisplayName?: string
  clientEmail?: string
  internalNotes?: string
}

export interface IProjectUpdate {
  title?: string
  description?: string
  eventDate?: string | null
  location?: string | null
  status?: ProjectStatus
  clientDisplayName?: string | null
  clientEmail?: string | null
  internalNotes?: string | null
}

export interface IMilestone {
  id: number
  projectId: number
  title: string
  description: string | null
  dueDate: string | null
  status: 'pending' | 'in_progress' | 'complete'
  clientVisible: boolean
  sortOrder: number
  completedAt: Date | null
}

export interface IInvoice {
  id: number
  projectId: number
  invoiceNumber: string | null
  title: string
  description: string | null
  amount: number
  currency: string
  dueDate: string | null
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  invoiceKind: InvoiceKind
  isDateHoldingDeposit: boolean
  paidAt?: Date | null
  paymentMethod?: string | null
  clientPaymentClaimedAt?: Date | null
  clientPaymentNote?: string | null
}

export interface IClientPaymentOptions {
  stripeEnabled: boolean
  venmoHandle: string | null
  zelleHandle: string | null
  cashappHandle: string | null
  paypalHandle: string | null
  paymentInstructions: string | null
}

export interface IContractSummary {
  id: number
  title: string
  acknowledgedAt: Date | null
  acknowledgementLegalName?: string | null
}

export interface IDeliverableSummary {
  id: number
  title: string
  fileName: string
  fileSizeBytes: number | null
  clientVisible: boolean
}

export interface IClientPortalProject {
  project: IProject
  vendorBusinessName: string
  vendorLogoUrl: string | null
  primaryColor: string
  paymentOptions: IClientPaymentOptions
  paymentSettings: IProjectPaymentSettings
  paymentSummary: ProjectPaymentSummary
  milestones: IMilestone[]
  invoices: IInvoice[]
  contracts: IContractSummary[]
  deliverables: IDeliverableSummary[]
  pendingInvite: { token: string; email: string; expiresAt: Date } | null
}

export interface ILinkedClient {
  email: string
  clientDisplayName: string | null
  linkedAt: Date
}

export interface IVendorProjectDetail {
  project: IProject
  linkedClient: ILinkedClient | null
  paymentSettings: IProjectPaymentSettings
  paymentSummary: ProjectPaymentSummary
  contracts: Array<{
    id: number
    title: string
    fileName: string
    acknowledgedAt: Date | null
    createdAt: Date
  }>
  milestones: IMilestone[]
  invoices: IInvoice[]
  deliverables: Array<{
    id: number
    title: string
    fileName: string
    fileSizeBytes: number | null
    clientVisible: boolean
    createdAt: Date
  }>
}

function mapProjectRow(row: any): IProject {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    title: row.title,
    description: row.description ?? null,
    eventDate: formatDateOnly(row.wedding_date),
    location: row.location ?? null,
    status: row.status,
    clientDisplayName: row.couple_display_name ?? null,
    clientEmail: row.client_email ?? null,
    internalNotes: row.internal_notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapInvoiceSummary(inv: {
  id: number
  project_id: number
  invoice_number: string | null
  title: string
  description: string | null
  amount: string | number
  currency: string
  due_date: Date | string | null
  status: IInvoice['status']
  invoice_kind: InvoiceKind
  is_date_holding_deposit: boolean
  paid_at?: Date | null
  payment_method?: string | null
  client_payment_claimed_at?: Date | null
  client_payment_note?: string | null
}): IInvoice {
  return {
    id: inv.id,
    projectId: inv.project_id,
    invoiceNumber: inv.invoice_number,
    title: inv.title,
    description: inv.description,
    amount: parseFloat(String(inv.amount)),
    currency: inv.currency,
    dueDate: formatDateOnly(inv.due_date),
    status: inv.status,
    invoiceKind: inv.invoice_kind,
    isDateHoldingDeposit: inv.is_date_holding_deposit,
    paidAt: inv.paid_at ?? null,
    paymentMethod: inv.payment_method ?? null,
    clientPaymentClaimedAt: inv.client_payment_claimed_at ?? null,
    clientPaymentNote: inv.client_payment_note ?? null,
  }
}

export class ProjectModel {
  static async findByVendorId(vendorId: number): Promise<IProject[]> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT * FROM projects
      WHERE vendor_id = $1
      ORDER BY wedding_date ASC NULLS LAST, created_at DESC
      `,
      [vendorId]
    )
    return result.rows.map(mapProjectRow)
  }

  static async findById(id: number): Promise<IProject | null> {
    const pool = getPool()
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id])
    return result.rows.length > 0 ? mapProjectRow(result.rows[0]) : null
  }

  static async findByIdForVendor(id: number, vendorId: number): Promise<IProject | null> {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND vendor_id = $2',
      [id, vendorId]
    )
    return result.rows.length > 0 ? mapProjectRow(result.rows[0]) : null
  }

  static async findDetailForVendor(
    id: number,
    vendorId: number
  ): Promise<IVendorProjectDetail | null> {
    const project = await this.findByIdForVendor(id, vendorId)
    if (!project) {
      return null
    }

    const pool = getPool()

    const [linkedClientResult, milestonesResult, invoicesResult, contracts, deliverables, paymentSettings] =
      await Promise.all([
      pool.query(
        `
        SELECT u.email, pc.couple_display_name, pc.linked_at
        FROM project_clients pc
        INNER JOIN users u ON u.id = pc.client_user_id
        WHERE pc.project_id = $1
        LIMIT 1
        `,
        [id]
      ),
      pool.query(
        `
        SELECT * FROM milestones
        WHERE project_id = $1
        ORDER BY sort_order ASC, id ASC
        `,
        [id]
      ),
      pool.query(
        `
        SELECT * FROM invoices
        WHERE project_id = $1
        ORDER BY due_date ASC NULLS LAST, id ASC
        `,
        [id]
      ),
      Contract.findByProjectForVendor(id, vendorId),
      Deliverable.findByProjectForVendor(id, vendorId),
      ProjectPaymentSettings.findByProjectForVendor(id, vendorId),
    ])

    const linkedRow = linkedClientResult.rows[0]
    const linkedClient = linkedRow
      ? {
          email: linkedRow.email as string,
          clientDisplayName: (linkedRow.couple_display_name as string | null) ?? null,
          linkedAt: linkedRow.linked_at as Date,
        }
      : null

    const invoiceSummaries = invoicesResult.rows.map(mapInvoiceSummary)
    const resolvedPaymentSettings = paymentSettings ?? ProjectPaymentSettings.getDefault(id)
    const paymentSummary = summarizeProjectPayments({
      settings: resolvedPaymentSettings,
      invoices: invoiceSummaries.map((invoice) => ({
        id: invoice.id,
        title: invoice.title,
        amount: invoice.amount,
        status: invoice.status,
        invoiceKind: invoice.invoiceKind,
      })),
    })

    return {
      project,
      linkedClient,
      paymentSettings: resolvedPaymentSettings,
      paymentSummary,
      contracts,
      milestones: milestonesResult.rows.map((m) => ({
        id: m.id,
        projectId: m.project_id,
        title: m.title,
        description: m.description,
        dueDate: m.due_date ? String(m.due_date).slice(0, 10) : null,
        status: m.status,
        clientVisible: m.client_visible,
        sortOrder: m.sort_order,
        completedAt: m.completed_at,
      })),
      invoices: invoiceSummaries,
      deliverables,
    }
  }

  static async create(vendorId: number, data: IProjectCreate): Promise<IProject> {
    const pool = getPool()
    const result = await pool.query(
      `
      INSERT INTO projects (
        vendor_id, title, description, wedding_date, location, status,
        couple_display_name, client_email, internal_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        vendorId,
        data.title,
        data.description ?? null,
        formatDateOnly(data.eventDate),
        data.location ?? null,
        data.status ?? 'inquiry',
        data.clientDisplayName ?? null,
        data.clientEmail ?? null,
        data.internalNotes ?? null,
      ]
    )
    return mapProjectRow(result.rows[0])
  }

  static async update(
    id: number,
    vendorId: number,
    data: IProjectUpdate
  ): Promise<IProject | null> {
    const fields: string[] = []
    const values: unknown[] = []
    let param = 1

    const setField = (column: string, value: unknown) => {
      fields.push(`${column} = $${param++}`)
      values.push(value)
    }

    if (data.title !== undefined) setField('title', data.title)
    if (data.description !== undefined) setField('description', data.description)
    if (data.eventDate !== undefined) setField('wedding_date', formatDateOnly(data.eventDate))
    if (data.location !== undefined) setField('location', data.location)
    if (data.status !== undefined) setField('status', data.status)
    if (data.clientDisplayName !== undefined) {
      setField('couple_display_name', data.clientDisplayName)
    }
    if (data.clientEmail !== undefined) setField('client_email', data.clientEmail)
    if (data.internalNotes !== undefined) setField('internal_notes', data.internalNotes)

    if (fields.length === 0) {
      return this.findByIdForVendor(id, vendorId)
    }

    fields.push('updated_at = NOW()')
    values.push(id, vendorId)

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE projects SET ${fields.join(', ')}
      WHERE id = $${param++} AND vendor_id = $${param}
      RETURNING *
      `,
      values
    )

    return result.rows.length > 0 ? mapProjectRow(result.rows[0]) : null
  }

  static async delete(id: number, vendorId: number): Promise<boolean> {
    const pool = getPool()
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND vendor_id = $2',
      [id, vendorId]
    )
    return (result.rowCount ?? 0) > 0
  }

  static async findClientProject(clientUserId: number): Promise<IClientPortalProject | null> {
    const pool = getPool()

    const projectResult = await pool.query(
      `
      SELECT p.*,
        COALESCE(vp.business_name, u.first_name || ' ' || u.last_name) AS vendor_business_name,
        vp.logo_url,
        COALESCE(vp.primary_color, '#2563eb') AS primary_color
      FROM project_clients pc
      INNER JOIN projects p ON p.id = pc.project_id
      INNER JOIN users u ON u.id = p.vendor_id
      LEFT JOIN vendor_profiles vp ON vp.user_id = p.vendor_id
      WHERE pc.client_user_id = $1
      LIMIT 1
      `,
      [clientUserId]
    )

    if (projectResult.rows.length === 0) {
      return null
    }

    const row = projectResult.rows[0]
    const project = mapProjectRow(row)
    const projectId = project.id

    const [milestones, invoices, contracts, deliverables, paymentOptions, paymentSettings] = await Promise.all([
      pool.query(
        `
        SELECT * FROM milestones
        WHERE project_id = $1 AND client_visible = true
        ORDER BY sort_order ASC, id ASC
        `,
        [projectId]
      ),
      pool.query(
        `
        SELECT * FROM invoices
        WHERE project_id = $1 AND status != 'draft'
        ORDER BY due_date ASC NULLS LAST, id ASC
        `,
        [projectId]
      ),
      pool.query(
        `SELECT id, title, acknowledged_at FROM contracts WHERE project_id = $1 ORDER BY id ASC`,
        [projectId]
      ),
      pool.query(
        `
        SELECT id, title, file_name, file_size_bytes, client_visible FROM deliverables
        WHERE project_id = $1 AND client_visible = true
        ORDER BY id DESC
        `,
        [projectId]
      ),
      VendorPaymentSettings.findByProjectForClient(projectId),
      ProjectPaymentSettings.findByProjectForClient(projectId),
    ])

    const invoiceSummaries = invoices.rows.map(mapInvoiceSummary)
    const paymentSummary = summarizeProjectPayments({
      settings: paymentSettings,
      invoices: invoiceSummaries.map((invoice) => ({
        id: invoice.id,
        title: invoice.title,
        amount: invoice.amount,
        status: invoice.status,
        invoiceKind: invoice.invoiceKind,
      })),
    })

    return {
      project,
      vendorBusinessName: row.vendor_business_name,
      vendorLogoUrl: row.logo_url ?? null,
      primaryColor: row.primary_color,
      paymentOptions,
      paymentSettings,
      paymentSummary,
      milestones: milestones.rows.map((m) => ({
        id: m.id,
        projectId: m.project_id,
        title: m.title,
        description: m.description,
        dueDate: m.due_date ? String(m.due_date).slice(0, 10) : null,
        status: m.status,
        clientVisible: m.client_visible,
        sortOrder: m.sort_order,
        completedAt: m.completed_at,
      })),
      invoices: invoiceSummaries,
      contracts: contracts.rows.map((c) => ({
        id: c.id,
        title: c.title,
        acknowledgedAt: c.acknowledged_at,
      })),
      deliverables: deliverables.rows.map((d) => ({
        id: d.id,
        title: d.title,
        fileName: d.file_name,
        fileSizeBytes: d.file_size_bytes != null ? Number(d.file_size_bytes) : null,
        clientVisible: d.client_visible,
      })),
      pendingInvite: null,
    }
  }

  static async createInvite(
    projectId: number,
    vendorId: number,
    email: string,
    expiresInDays = 14
  ): Promise<{ token: string; email: string; expiresAt: Date }> {
    const pool = getPool()

    const project = await this.findByIdForVendor(projectId, vendorId)
    if (!project) {
      throw new Error('PROJECT_NOT_FOUND')
    }

    const existingClient = await pool.query(
      `
      SELECT u.email FROM project_clients pc
      INNER JOIN users u ON u.id = pc.client_user_id
      WHERE pc.project_id = $1
      LIMIT 1
      `,
      [projectId]
    )

    if (existingClient.rows.length > 0) {
      throw new Error('PROJECT_ALREADY_HAS_CLIENT')
    }

    const result = await pool.query(
      `
      INSERT INTO project_invites (project_id, email, expires_at, created_by)
      VALUES ($1, $2, NOW() + ($3 || ' days')::INTERVAL, $4)
      RETURNING token, email, expires_at
      `,
      [projectId, email.toLowerCase().trim(), String(expiresInDays), vendorId]
    )

    await pool.query(
      `UPDATE projects SET client_email = $1, updated_at = NOW() WHERE id = $2`,
      [email.toLowerCase().trim(), projectId]
    )

    const invite = result.rows[0]
    return {
      token: invite.token,
      email: invite.email,
      expiresAt: invite.expires_at,
    }
  }
}

export const Project = ProjectModel
