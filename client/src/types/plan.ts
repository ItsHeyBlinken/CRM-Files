export type VendorPlan = 'starter' | 'pro'

export type PlanLimitSnapshot = {
  limit: number
  used: number
  remaining: number | null
  atLimit: boolean
}

export type VendorPlanBilling = {
  configured: boolean
  canUpgrade: boolean
  canManage: boolean
  subscriptionStatus: string | null
  stripePublishableKey?: string | null
}

export type VendorPlanUsage = {
  plan: VendorPlan
  limits: {
    activeProjects: PlanLimitSnapshot
    quotesThisMonth: PlanLimitSnapshot & { periodLabel: string }
  }
  upgradeRequired: boolean
  billing?: VendorPlanBilling
}

export type PlanLimitErrorPayload = {
  error: string
  code: 'PLAN_LIMIT_QUOTES' | 'PLAN_LIMIT_PROJECTS'
  plan: VendorPlan
  limit: number
  used: number
  upgradeRequired: boolean
}
