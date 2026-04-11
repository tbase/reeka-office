type Period = {
  year: number
  month: number
} | null | undefined

export function formatNumber(value: number | null | undefined): string {
  const safeValue = Number.isFinite(value) ? Number(value) : 0

  return safeValue
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatMetricValue(value: number | null | undefined): string {
  const safeValue = Number.isFinite(value) ? Number(value) : 0
  const normalized = safeValue / 100

  return normalized.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatCompactMetricValue(value: number | null | undefined): string {
  const safeValue = Number.isFinite(value) ? Number(value) : 0
  const normalized = safeValue / 100
  const absoluteValue = Math.abs(normalized)

  if (absoluteValue >= 100_000_000) {
    return formatMetricUnit(normalized, 100_000_000, '亿')
  }

  if (absoluteValue >= 10_000) {
    return formatMetricUnit(normalized, 10_000, '万')
  }

  return normalized.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: normalized >= 10 ? 1 : 2,
  })
}

function formatMetricUnit(
  value: number,
  divisor: number,
  unit: '万' | '亿',
): string {
  const unitValue = value / divisor
  const absoluteValue = Math.abs(unitValue)
  const maximumFractionDigits = absoluteValue >= 10 ? 1 : 2
  const formattedValue = unitValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })

  return `${formattedValue}${unit}`
}

export function formatPeriod(period: Period): string {
  if (!period) {
    return '暂无业绩数据'
  }

  return `${period.year} 年 ${String(period.month).padStart(2, '0')} 月`
}

export function formatMonth(month: number): string {
  return `${String(month).padStart(2, '0')} 月`
}

export function formatQualified(value: boolean): string {
  return value ? '已合资格' : '未合资格'
}

export function formatDesignation(value: string | null | undefined): string {
  return value?.trim() || '未设职级'
}

export function formatRate(value: number | null | undefined): string {
  return `${formatNumber(value)}%`
}
