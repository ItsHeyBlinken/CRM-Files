import axios from 'axios'
import type { PlanLimitErrorPayload } from '../types/plan'

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined
    if (data?.error) {
      return data.error
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export function getPlanLimitPayload(error: unknown): PlanLimitErrorPayload | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) {
    return null
  }
  const data = error.response.data as PlanLimitErrorPayload | undefined
  if (data?.upgradeRequired && data.code) {
    return data
  }
  return null
}
