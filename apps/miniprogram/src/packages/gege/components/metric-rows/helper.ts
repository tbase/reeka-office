import type {
  MetricAmountRow,
  MetricMemberRow,
  MetricQualificationRow,
} from './types'

import {
  formatMetricValue,
  formatNumber,
  formatQualified,
} from '../../lib/format'

export function createAmountMetric(
  label: 'NSC' | 'CASE',
  monthValue: number | null | undefined,
  totalValue: number | null | undefined,
): MetricAmountRow {
  return {
    kind: 'amount',
    label,
    monthValue: formatMetricValue(monthValue),
    totalValue: formatMetricValue(totalValue),
  }
}

export function createMemberMetric(
  qualifiedCount: number | null | undefined,
  memberCount: number | null | undefined,
): MetricMemberRow {
  return {
    kind: 'member',
    label: '成员',
    qualifiedValue: formatNumber(qualifiedCount),
    totalValue: formatNumber(memberCount),
  }
}

function formatQualificationValue(
  qualified: boolean | number | null | undefined,
  gap: number | null | undefined,
): string {
  if (isQualificationMet(qualified)) {
    return formatQualified(true)
  }

  if (qualified != null) {
    return gap == null ? formatQualified(false) : formatMetricValue(gap)
  }

  return '-'
}

function isQualificationMet(value: boolean | number | null | undefined): boolean {
  return typeof value === 'number' ? value > 0 : value === true
}

export function createQualificationMetric(
  qualified: boolean | number | null | undefined,
  gap: number | null | undefined,
  nextMonthQualified: boolean | number | null | undefined,
  nextMonthGap: number | null | undefined,
): MetricQualificationRow {
  return {
    kind: 'qualification',
    label: '合资格',
    isQualified: isQualificationMet(qualified),
    qualifiedGap: formatQualificationValue(qualified, gap),
    isQualifiedNextMonth: isQualificationMet(nextMonthQualified),
    qualifiedGapNextMonth: formatQualificationValue(nextMonthQualified, nextMonthGap),
  }
}
