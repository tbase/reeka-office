export function ensureInteger(value: number, label: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label}必须为整数`)
  }

  return value
}

export function ensureYear(year: number, label = '年份'): number {
  ensureInteger(year, label)
  if (year < 2000 || year > 2100) {
    throw new Error(`${label}无效`)
  }

  return year
}

export function ensureMonth(month: number, label = '月份'): number {
  ensureInteger(month, label)
  if (month < 1 || month > 12) {
    throw new Error(`${label}无效`)
  }

  return month
}

export function normalizeOptionalText(value?: string | null): string | null {
  const text = value?.trim()
  return text ? text : null
}
