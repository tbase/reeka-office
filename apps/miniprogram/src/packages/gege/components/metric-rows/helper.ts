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
  qualified: boolean | null | undefined,
  gap: number | null | undefined,
): string {
  if (qualified === true) {
    return formatQualified(true)
  }

  if (qualified === false) {
    return gap == null ? formatQualified(false) : formatMetricValue(gap)
  }

  return '-'
}

export function createQualificationMetric(
  qualified: boolean | null | undefined,
  gap: number | null | undefined,
  nextMonthQualified: boolean | null | undefined,
  nextMonthGap: number | null | undefined,
): MetricQualificationRow {
  return {
    kind: 'qualification',
    label: '合资格',
    isQualified: qualified ?? false,
    qualifiedGap: formatQualificationValue(qualified, gap),
    isQualifiedNextMonth: nextMonthQualified ?? false,
    qualifiedGapNextMonth: formatQualificationValue(nextMonthQualified, nextMonthGap),
  }
}
