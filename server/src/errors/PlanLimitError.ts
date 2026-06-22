import type { VendorPlan } from '../constants/planLimits'

export type PlanLimitCode = 'PLAN_LIMIT_QUOTES' | 'PLAN_LIMIT_PROJECTS'

export class PlanLimitError extends Error {
  readonly code: PlanLimitCode
  readonly plan: VendorPlan
  readonly limit: number
  readonly used: number

  constructor(
    code: PlanLimitCode,
    message: string,
    plan: VendorPlan,
    limit: number,
    used: number
  ) {
    super(message)
    this.name = 'PlanLimitError'
    this.code = code
    this.plan = plan
    this.limit = limit
    this.used = used
  }
}
