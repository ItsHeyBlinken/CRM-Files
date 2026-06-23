import { getPool } from '../config/database'
import { normalizeStripePaymentLink, parseStripePaymentLinkInput } from '../utils/stripePaymentLink'

export interface IVendorPaymentSettings {
  vendorId: number
  stripePaymentLink: string | null
  venmoHandle: string | null
  zelleHandle: string | null
  cashappHandle: string | null
  paypalHandle: string | null
  paymentInstructions: string | null
  paymentSetupComplete: boolean
}

export interface IVendorPaymentSettingsUpdate {
  venmoHandle?: string | null
  zelleHandle?: string | null
  cashappHandle?: string | null
  paypalHandle?: string | null
  paymentInstructions?: string | null
  stripePaymentLink?: string | null
}

export interface IClientPaymentOptions {
  stripeEnabled: boolean
  stripePaymentLink: string | null
  venmoHandle: string | null
  zelleHandle: string | null
  cashappHandle: string | null
  paypalHandle: string | null
  paymentInstructions: string | null
}

function mapRow(row: {
  vendor_id: number
  stripe_payment_link?: string | null
  venmo_handle: string | null
  zelle_handle: string | null
  cashapp_handle: string | null
  paypal_handle: string | null
  payment_instructions: string | null
  payment_setup_complete?: boolean
}): IVendorPaymentSettings {
  return {
    vendorId: row.vendor_id,
    stripePaymentLink: row.stripe_payment_link ?? null,
    venmoHandle: row.venmo_handle,
    zelleHandle: row.zelle_handle,
    cashappHandle: row.cashapp_handle,
    paypalHandle: row.paypal_handle,
    paymentInstructions: row.payment_instructions,
    paymentSetupComplete: Boolean(row.payment_setup_complete),
  }
}

export function hasAnyClientPaymentMethod(settings: IVendorPaymentSettings): boolean {
  return Boolean(
    normalizeStripePaymentLink(settings.stripePaymentLink) ||
      settings.venmoHandle ||
      settings.zelleHandle ||
      settings.cashappHandle ||
      settings.paypalHandle
  )
}

function normalizeHandle(value: string | null | undefined): string | null {
  if (value === undefined) {
    return null
  }
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export class VendorPaymentSettingsModel {
  static async findByVendorId(vendorId: number): Promise<IVendorPaymentSettings> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT * FROM vendor_payment_settings WHERE vendor_id = $1`,
      [vendorId]
    )

    if (result.rows.length > 0) {
      return mapRow(result.rows[0])
    }

    const insert = await pool.query(
      `
      INSERT INTO vendor_payment_settings (vendor_id)
      VALUES ($1)
      ON CONFLICT (vendor_id) DO UPDATE SET vendor_id = EXCLUDED.vendor_id
      RETURNING *
      `,
      [vendorId]
    )
    return mapRow(insert.rows[0])
  }

  static async findByProjectForClient(projectId: number): Promise<IClientPaymentOptions> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT
        vps.stripe_payment_link,
        vps.venmo_handle,
        vps.zelle_handle,
        vps.cashapp_handle,
        vps.paypal_handle,
        vps.payment_instructions
      FROM projects p
      LEFT JOIN vendor_payment_settings vps ON vps.vendor_id = p.vendor_id
      WHERE p.id = $1
      `,
      [projectId]
    )

    if (result.rows.length === 0) {
      return {
        stripeEnabled: false,
        stripePaymentLink: null,
        venmoHandle: null,
        zelleHandle: null,
        cashappHandle: null,
        paypalHandle: null,
        paymentInstructions: null,
      }
    }

    const row = result.rows[0]
    const stripePaymentLink = normalizeStripePaymentLink(row.stripe_payment_link ?? null)

    return {
      stripeEnabled: Boolean(stripePaymentLink),
      stripePaymentLink,
      venmoHandle: row.venmo_handle ?? null,
      zelleHandle: row.zelle_handle ?? null,
      cashappHandle: row.cashapp_handle ?? null,
      paypalHandle: row.paypal_handle ?? null,
      paymentInstructions: row.payment_instructions ?? null,
    }
  }

  static async updateSettings(
    vendorId: number,
    data: IVendorPaymentSettingsUpdate
  ): Promise<IVendorPaymentSettings> {
    await this.findByVendorId(vendorId)

    const fields: string[] = []
    const values: unknown[] = []
    let param = 1

    const setField = (column: string, value: unknown) => {
      fields.push(`${column} = $${param++}`)
      values.push(value)
    }

    if (data.venmoHandle !== undefined) setField('venmo_handle', normalizeHandle(data.venmoHandle))
    if (data.zelleHandle !== undefined) setField('zelle_handle', normalizeHandle(data.zelleHandle))
    if (data.cashappHandle !== undefined) {
      setField('cashapp_handle', normalizeHandle(data.cashappHandle))
    }
    if (data.paypalHandle !== undefined) {
      setField('paypal_handle', normalizeHandle(data.paypalHandle))
    }
    if (data.paymentInstructions !== undefined) {
      setField('payment_instructions', normalizeHandle(data.paymentInstructions))
    }
    if (data.stripePaymentLink !== undefined) {
      const parsed = parseStripePaymentLinkInput(data.stripePaymentLink)
      if (!parsed.ok) {
        throw new Error('INVALID_STRIPE_PAYMENT_LINK')
      }
      setField('stripe_payment_link', parsed.link)
    }

    if (fields.length === 0) {
      return this.findByVendorId(vendorId)
    }

    fields.push('updated_at = NOW()')
    values.push(vendorId)

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE vendor_payment_settings SET ${fields.join(', ')}
      WHERE vendor_id = $${param}
      RETURNING *
      `,
      values
    )

    return mapRow(result.rows[0])
  }

  static async isPaymentSetupComplete(vendorId: number): Promise<boolean> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT payment_setup_complete FROM vendor_payment_settings WHERE vendor_id = $1`,
      [vendorId]
    )
    if (result.rows.length === 0) {
      return false
    }
    return Boolean(result.rows[0].payment_setup_complete)
  }

  static async markPaymentSetupComplete(vendorId: number): Promise<void> {
    await this.findByVendorId(vendorId)
    const pool = getPool()
    await pool.query(
      `
      UPDATE vendor_payment_settings
      SET payment_setup_complete = true, updated_at = NOW()
      WHERE vendor_id = $1
      `,
      [vendorId]
    )
  }
}

export const VendorPaymentSettings = VendorPaymentSettingsModel
