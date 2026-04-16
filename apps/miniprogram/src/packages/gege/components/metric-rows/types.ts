export interface MetricAmountRow {
  kind: 'amount'
  label: 'NSC' | 'CASE'
  monthValue: string
  totalValue: string
}

export interface MetricMemberRow {
  kind: 'member'
  label: '成员'
  qualifiedValue: string
  totalValue: string
}

export interface MetricQualificationRow {
  kind: 'qualification'
  label: '合资格'
  isQualified: boolean
  qualifiedGap: string | null
  isQualifiedNextMonth: boolean
  qualifiedGapNextMonth: string | null
}

export type MetricRow = MetricAmountRow | MetricMemberRow | MetricQualificationRow
