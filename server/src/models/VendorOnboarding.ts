import { getPool } from '../config/database'
import {
  hasAnyClientPaymentMethod,
  VendorPaymentSettings,
} from './VendorPaymentSettings'

export interface IVendorOnboardingStatus {
  needsOnboarding: boolean
  businessName: string
  paymentSetupComplete: boolean
  hasPaymentMethod: boolean
  stripeConfigured: boolean
  settings: Awaited<ReturnType<typeof VendorPaymentSettings.findByVendorId>>
}

export interface IVendorChecklist {
  hasProject: boolean
  hasLinkedClient: boolean
  hasSentInvoice: boolean
}

export class VendorOnboardingModel {
  static async getStatus(vendorId: number): Promise<IVendorOnboardingStatus> {
    const pool = getPool()
    const [profileResult, settings] = await Promise.all([
      pool.query(`SELECT business_name FROM vendor_profiles WHERE user_id = $1`, [vendorId]),
      VendorPaymentSettings.findByVendorId(vendorId),
    ])

    const businessName = profileResult.rows[0]?.business_name ?? ''
    const paymentSetupComplete = settings.paymentSetupComplete
    const hasPaymentMethod = hasAnyClientPaymentMethod(settings)

    return {
      needsOnboarding: !paymentSetupComplete,
      businessName,
      paymentSetupComplete,
      hasPaymentMethod,
      stripeConfigured: false,
      settings,
    }
  }

  static async getChecklist(vendorId: number): Promise<IVendorChecklist> {
    const pool = getPool()

    const [projects, clients, invoices] = await Promise.all([
      pool.query(`SELECT id FROM projects WHERE vendor_id = $1 LIMIT 1`, [vendorId]),
      pool.query(
        `
        SELECT pc.id FROM project_clients pc
        INNER JOIN projects p ON p.id = pc.project_id
        WHERE p.vendor_id = $1
        LIMIT 1
        `,
        [vendorId]
      ),
      pool.query(
        `
        SELECT i.id FROM invoices i
        INNER JOIN projects p ON p.id = i.project_id
        WHERE p.vendor_id = $1 AND i.status IN ('sent', 'paid', 'overdue')
        LIMIT 1
        `,
        [vendorId]
      ),
    ])

    return {
      hasProject: projects.rows.length > 0,
      hasLinkedClient: clients.rows.length > 0,
      hasSentInvoice: invoices.rows.length > 0,
    }
  }

  static async completeOnboarding(
    vendorId: number,
    data: {
      businessName: string
      venmoHandle?: string | null
      zelleHandle?: string | null
      cashappHandle?: string | null
      paypalHandle?: string | null
      paymentInstructions?: string | null
      stripePaymentLink?: string | null
      skipPaymentSetup?: boolean
    }
  ): Promise<IVendorOnboardingStatus> {
    const businessName = data.businessName?.trim()
    if (!businessName) {
      throw new Error('BUSINESS_NAME_REQUIRED')
    }

    const pool = getPool()
    await pool.query(
      `
      UPDATE vendor_profiles SET business_name = $2, updated_at = NOW()
      WHERE user_id = $1
      `,
      [vendorId, businessName]
    )

    const settings = await VendorPaymentSettings.updateSettings(vendorId, {
      ...(data.venmoHandle !== undefined && { venmoHandle: data.venmoHandle }),
      ...(data.zelleHandle !== undefined && { zelleHandle: data.zelleHandle }),
      ...(data.cashappHandle !== undefined && { cashappHandle: data.cashappHandle }),
      ...(data.paypalHandle !== undefined && { paypalHandle: data.paypalHandle }),
      ...(data.paymentInstructions !== undefined && {
        paymentInstructions: data.paymentInstructions,
      }),
      ...(data.stripePaymentLink !== undefined && { stripePaymentLink: data.stripePaymentLink }),
    })

    const hasPaymentMethod = hasAnyClientPaymentMethod(settings)
    const skipPaymentSetup = Boolean(data.skipPaymentSetup)

    if (!skipPaymentSetup && !hasPaymentMethod) {
      throw new Error('PAYMENT_METHOD_REQUIRED')
    }

    await VendorPaymentSettings.markPaymentSetupComplete(vendorId)
    return this.getStatus(vendorId)
  }
}

export const VendorOnboarding = VendorOnboardingModel
