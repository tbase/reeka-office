import type { ApmPeriod } from "@reeka-office/domain-performance"

export function formatPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

export function parsePerformancePeriod(value?: string): string | null {
  const period = value?.trim()
  if (!period) {
    return null
  }

  const match = period.match(/^(\d{4})-(\d{2})$/)
  if (!match) {
    return null
  }

  const month = Number(match[2])
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }

  return period
}

export function resolveActivePeriod(
  periods: readonly ApmPeriod[],
  requested: string | null,
): ApmPeriod | null {
  const latestPeriod = periods[0] ?? null
  if (!latestPeriod) {
    return null
  }

  const parsedRequested = parsePerformancePeriod(requested ?? undefined)
  if (!parsedRequested) {
    return latestPeriod
  }

  const matchedPeriod = periods.find(
    (period) => formatPeriod(period.year, period.month) === parsedRequested,
  )

  return matchedPeriod ?? latestPeriod
}
