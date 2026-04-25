import { ensureMonth, ensureYear } from '@reeka-office/domain-shared'

export interface Period {
  year: number
  month: number
}

export function createPeriod(input: Period): Period {
  return {
    year: ensureYear(input.year),
    month: ensureMonth(input.month),
  }
}

export function periodToIndex(period: Period): number {
  return period.year * 12 + period.month
}

export function addMonths(period: Period, months: number): Period {
  const zeroBasedIndex = period.year * 12 + (period.month - 1) + months

  return {
    year: Math.floor(zeroBasedIndex / 12),
    month: (zeroBasedIndex % 12) + 1,
  }
}

export function comparePeriods(left: Period, right: Period): number {
  return periodToIndex(left) - periodToIndex(right)
}

export function maxPeriod(periods: Array<Period | null | undefined>): Period | null {
  return periods.reduce<Period | null>((currentMax, period) => {
    if (!period) {
      return currentMax
    }

    return currentMax == null || comparePeriods(period, currentMax) > 0
      ? period
      : currentMax
  }, null)
}

export function getQuarter(period: Period): number {
  return Math.floor((period.month - 1) / 3) + 1
}

export function isQuarterEndMonth(period: Period): boolean {
  return period.month === 3
    || period.month === 6
    || period.month === 9
    || period.month === 12
}

export function getCurrentQualificationPeriods(now = new Date()) {
  const current = createPeriod({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })

  return {
    current,
    next: addMonths(current, 1),
  }
}

export function formatPeriodKey(period: Period): string {
  return `${period.year}:${period.month}`
}

export function parseDateToPeriod(value: string | null): Period | null {
  const matched = value?.match(/^(\d{4})-(\d{2})-\d{2}$/)
  if (!matched) {
    return null
  }

  return createPeriod({
    year: Number(matched[1]),
    month: Number(matched[2]),
  })
}
