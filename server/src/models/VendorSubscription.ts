import { getPool } from '../config/database'
import type { VendorPlan } from '../constants/planLimits'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

export interface IVendorBillingRecord {
  userId: number
  plan: VendorPlan
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  subscriptionStatus: SubscriptionStatus | null
  stripePriceId: string | null
}

const PRO_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = ['active', 'trialing', 'past_due']

function mapRow(row: {
  user_id: number
  plan: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  stripe_price_id: string | null
}): IVendorBillingRecord {
  return {
    userId: row.user_id,
    plan: row.plan === 'pro' ? 'pro' : 'starter',
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    subscriptionStatus: row.subscription_status as SubscriptionStatus | null,
    stripePriceId: row.stripe_price_id,
  }
}

export function isProSubscriptionStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false
  }
  return PRO_SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatus)
}

export class VendorSubscriptionModel {
  static async findByVendorId(vendorId: number): Promise<IVendorBillingRecord | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT user_id, plan, stripe_customer_id, stripe_subscription_id,
             subscription_status, stripe_price_id
      FROM vendor_profiles
      WHERE user_id = $1
      `,
      [vendorId]
    )
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null
  }

  static async setStripeCustomerId(vendorId: number, customerId: string): Promise<void> {
    const pool = getPool()
    await pool.query(
      `
      UPDATE vendor_profiles
      SET stripe_customer_id = $2, updated_at = NOW()
      WHERE user_id = $1
      `,
      [vendorId, customerId]
    )
  }

  static async applySubscription(
    vendorId: number,
    input: {
      stripeCustomerId: string
      stripeSubscriptionId: string
      subscriptionStatus: string
      stripePriceId: string | null
    }
  ): Promise<void> {
    const pool = getPool()
    const plan: VendorPlan = isProSubscriptionStatus(input.subscriptionStatus) ? 'pro' : 'starter'

    await pool.query(
      `
      UPDATE vendor_profiles
      SET plan = $2,
          stripe_customer_id = $3,
          stripe_subscription_id = $4,
          subscription_status = $5,
          stripe_price_id = COALESCE($6, stripe_price_id),
          updated_at = NOW()
      WHERE user_id = $1
      `,
      [
        vendorId,
        plan,
        input.stripeCustomerId,
        input.stripeSubscriptionId,
        input.subscriptionStatus,
        input.stripePriceId,
      ]
    )
  }

  static async clearSubscription(vendorId: number, status: string): Promise<void> {
    const pool = getPool()
    await pool.query(
      `
      UPDATE vendor_profiles
      SET plan = 'starter',
          stripe_subscription_id = NULL,
          subscription_status = $2,
          updated_at = NOW()
      WHERE user_id = $1
      `,
      [vendorId, status]
    )
  }
}

export const VendorSubscription = VendorSubscriptionModel
