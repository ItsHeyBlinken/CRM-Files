import type { Response } from 'express'
import { PlanLimitError } from '../errors/PlanLimitError'

export function isPlanLimitError(error: unknown): error is PlanLimitError {
  return error instanceof PlanLimitError
}

export function sendPlanLimitError(res: Response, error: PlanLimitError): void {
  res.status(403).json({
    error: error.message,
    code: error.code,
    plan: error.plan,
    limit: error.limit,
    used: error.used,
    upgradeRequired: true,
  })
}
