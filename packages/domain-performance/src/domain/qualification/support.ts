import type { Period } from '../period'

export const qualificationConfig = {
  newAgentMonthlyTarget: 2000000,
  seniorQuarterlyTargets: [5000000, 12000000, 20000000, 28000000],
} as const

export const rmDesignation = 5
export const seniorTeamNscTargets = [1950000, 2900000, 3900000, 3900000] as const

export type JoinDateParts = {
  year: number
  month: number
  day: number
}

export function parseJoinDate(value: string | null): JoinDateParts | null {
  const matched = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) {
    return null
  }

  return {
    year: Number(matched[1]),
    month: Number(matched[2]),
    day: Number(matched[3]),
  }
}

export function getMonthsSinceJoin(joinDate: JoinDateParts, period: Period): number {
  const rawMonths = (period.year - joinDate.year) * 12 + (period.month - joinDate.month)

  return joinDate.day > 1 ? rawMonths - 1 : rawMonths
}
