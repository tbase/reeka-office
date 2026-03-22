export const VALID_PLAN_STATUSES = ["published", "draft", "archived"] as const

export type PlanStatusFilter = (typeof VALID_PLAN_STATUSES)[number]

export function parsePlanStatus(value: string | undefined): PlanStatusFilter {
  if (VALID_PLAN_STATUSES.includes(value as PlanStatusFilter)) {
    return value as PlanStatusFilter
  }

  return "published"
}
