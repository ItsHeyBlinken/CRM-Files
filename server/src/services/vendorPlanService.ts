import { getPool } from '../config/database'
import {
  isProPlan,
  STARTER_MAX_ACTIVE_PROJECTS,
  STARTER_MAX_QUOTES_PER_MONTH,
  type VendorPlan,
} from '../constants/planLimits'
import { PlanLimitError } from '../errors/PlanLimitError'

export type PlanLimitSnapshot = {
  limit: number
  used: number
  remaining: number | null
  atLimit: boolean
}

export type VendorPlanUsage = {
  plan: VendorPlan
  limits: {
    activeProjects: PlanLimitSnapshot
    quotesThisMonth: PlanLimitSnapshot & { periodLabel: string }
  }
  upgradeRequired: boolean
}

function buildLimitSnapshot(limit: number | null, used: number): PlanLimitSnapshot {
  if (limit === null) {
    return { limit: -1, used, remaining: null, atLimit: false }
  }
  const remaining = Math.max(0, limit - used)
  return { limit, used, remaining, atLimit: used >= limit }
}

function currentMonthPeriodLabel(now = new Date()): string {
  return now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export class VendorPlanService {
  static async getPlan(vendorId: number): Promise<VendorPlan> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT plan FROM vendor_profiles WHERE user_id = $1`,
      [vendorId]
    )
    const plan = result.rows[0]?.plan as VendorPlan | undefined
    return plan === 'pro' ? 'pro' : 'starter'
  }

  static async countActiveProjects(vendorId: number): Promise<number> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM projects
      WHERE vendor_id = $1
        AND status NOT IN ('complete', 'cancelled')
      `,
      [vendorId]
    )
    return result.rows[0]?.count ?? 0
  }

  static async countQuotesThisMonth(vendorId: number, now = new Date()): Promise<number> {
    const pool = getPool()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM quotes
      WHERE vendor_id = $1
        AND created_at >= $2
        AND created_at < $3
      `,
      [vendorId, monthStart, nextMonthStart]
    )
    return result.rows[0]?.count ?? 0
  }

  static async getUsage(vendorId: number): Promise<VendorPlanUsage> {
    const plan = await this.getPlan(vendorId)
    const activeProjectsUsed = await this.countActiveProjects(vendorId)
    const quotesUsed = await this.countQuotesThisMonth(vendorId)

    const projectLimit = isProPlan(plan) ? null : STARTER_MAX_ACTIVE_PROJECTS
    const quoteLimit = isProPlan(plan) ? null : STARTER_MAX_QUOTES_PER_MONTH

    const activeProjects = buildLimitSnapshot(projectLimit, activeProjectsUsed)
    const quotesThisMonth = {
      ...buildLimitSnapshot(quoteLimit, quotesUsed),
      periodLabel: currentMonthPeriodLabel(),
    }

    return {
      plan,
      limits: { activeProjects, quotesThisMonth },
      upgradeRequired: activeProjects.atLimit || quotesThisMonth.atLimit,
    }
  }

  static async assertCanCreateQuote(vendorId: number): Promise<void> {
    const plan = await this.getPlan(vendorId)
    if (isProPlan(plan)) {
      return
    }

    const used = await this.countQuotesThisMonth(vendorId)
    if (used >= STARTER_MAX_QUOTES_PER_MONTH) {
      throw new PlanLimitError(
        'PLAN_LIMIT_QUOTES',
        `Starter plan includes ${STARTER_MAX_QUOTES_PER_MONTH} quotes per month. Upgrade to Pro for unlimited quotes.`,
        plan,
        STARTER_MAX_QUOTES_PER_MONTH,
        used
      )
    }
  }

  static async assertCanAddActiveProject(vendorId: number): Promise<void> {
    const plan = await this.getPlan(vendorId)
    if (isProPlan(plan)) {
      return
    }

    const used = await this.countActiveProjects(vendorId)
    if (used >= STARTER_MAX_ACTIVE_PROJECTS) {
      throw new PlanLimitError(
        'PLAN_LIMIT_PROJECTS',
        `Starter plan includes ${STARTER_MAX_ACTIVE_PROJECTS} active project at a time. Complete or cancel your current project, or upgrade to Pro for unlimited projects.`,
        plan,
        STARTER_MAX_ACTIVE_PROJECTS,
        used
      )
    }
  }
}
