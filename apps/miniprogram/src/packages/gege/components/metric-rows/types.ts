export interface MetricAmountRow {
  kind: 'amount'
  label: 'NSC' | 'CASE'
  monthValue: string
  totalValue: string
  tone: string
}

export interface MetricMemberRow {
  kind: 'member'
  label: '成员'
  qualifiedValue: string
  totalValue: string
}

export type MetricRow = MetricAmountRow | MetricMemberRow
