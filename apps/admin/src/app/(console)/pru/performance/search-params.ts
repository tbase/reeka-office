import type { Period } from "@reeka-office/domain-performance"

export type PerformanceView = "table" | "stats"

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

export function parsePerformanceView(value?: string): PerformanceView | null {
  const view = value?.trim()
  if (view === "table" || view === "stats") {
    return view
  }

  return null
}

export function parsePerformanceYear(value?: string): number | null {
  const year = value?.trim()
  if (!year) {
    return null
  }

  if (!/^\d{4}$/.test(year)) {
    return null
  }

  const parsedYear = Number(year)
  return Number.isInteger(parsedYear) ? parsedYear : null
}

export function resolveActivePeriod(
  requested: string | null,
  latestPeriod: Period | null,
): Period | null {
  const parsedRequested = parsePerformancePeriod(requested ?? undefined)
  if (parsedRequested) {
    const [yearValue, monthValue] = parsedRequested.split("-")

    return {
      year: Number(yearValue),
      month: Number(monthValue),
    }
  }

  return latestPeriod
}

export function resolveYearOptions(periods: readonly Period[]): number[] {
  return [...new Set(periods.map((period) => period.year))].sort((left, right) => right - left)
}

export function resolveActiveYear(
  periods: readonly Period[],
  requested: string | null,
): number | null {
  const yearOptions = resolveYearOptions(periods)
  const latestYear = yearOptions[0] ?? null
  if (!latestYear) {
    return null
  }

  const parsedRequested = parsePerformanceYear(requested ?? undefined)
  if (!parsedRequested) {
    return latestYear
  }

  return yearOptions.includes(parsedRequested) ? parsedRequested : latestYear
}
