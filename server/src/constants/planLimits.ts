import type { ProjectStatus } from '../models/Project'

export type VendorPlan = 'starter' | 'pro'

export const STARTER_MAX_ACTIVE_PROJECTS = 1
export const STARTER_MAX_QUOTES_PER_MONTH = 3

export const INACTIVE_PROJECT_STATUSES: readonly ProjectStatus[] = ['complete', 'cancelled']

export function isProPlan(plan: VendorPlan): boolean {
  return plan === 'pro'
}

export function isActiveProjectStatus(status: ProjectStatus): boolean {
  return !INACTIVE_PROJECT_STATUSES.includes(status)
}
