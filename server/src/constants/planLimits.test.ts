import {
  isActiveProjectStatus,
  isProPlan,
  STARTER_MAX_ACTIVE_PROJECTS,
  STARTER_MAX_QUOTES_PER_MONTH,
} from './planLimits'

describe('planLimits', () => {
  test('starter quote limit is 3 per month', () => {
    expect(STARTER_MAX_QUOTES_PER_MONTH).toBe(3)
  })

  test('starter active project limit is 1', () => {
    expect(STARTER_MAX_ACTIVE_PROJECTS).toBe(1)
  })

  test('pro plan bypasses limits conceptually', () => {
    expect(isProPlan('pro')).toBe(true)
    expect(isProPlan('starter')).toBe(false)
  })

  test('active project statuses exclude complete and cancelled', () => {
    expect(isActiveProjectStatus('inquiry')).toBe(true)
    expect(isActiveProjectStatus('booked')).toBe(true)
    expect(isActiveProjectStatus('complete')).toBe(false)
    expect(isActiveProjectStatus('cancelled')).toBe(false)
  })
})
