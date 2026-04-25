export type DateParts = {
  year: number
  month: number
  day: number
}

export type MonthPeriod = {
  year: number
  month: number
}

export function parseDate(value: string | null): DateParts | null {
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

export function monthSince(date: DateParts, period: MonthPeriod): number {
  const rawMonths = (period.year - date.year) * 12 + (period.month - date.month)

  return date.day > 1 ? rawMonths - 1 : rawMonths
}
