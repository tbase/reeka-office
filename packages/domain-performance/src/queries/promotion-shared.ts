import type { DesignationName } from '@reeka-office/domain-agent'

import type { ApmPeriod } from './list-apm-periods'

export type PromotionStatus = 'ready' | 'no-target' | 'no-performance'

export type PromotionMetricKey =
  | 'net_sales_personal'
  | 'net_sales_team'
  | 'net_sales_team_direct'
  | 'net_case_personal'
  | 'num_qualified_team'
  | 'num_qualified_team_direct'
  | 'renewal_rate_team_direct'

export type PromotionMetricFormat = 'amount' | 'count' | 'percent'

export interface PromotionMetric {
  key: PromotionMetricKey
  label: string
  format: PromotionMetricFormat
  actual: number
  target: number
  difference: number
  progress: number
}

export interface AgentPromotionSnapshot {
  status: PromotionStatus
  agentCode: string
  designation: {
    actual: number | null
    actualName: DesignationName | null
    target: number | null
    targetName: DesignationName | null
  }
  lastPromotionDate: string | null
  saleCalculateStartPeriod: ApmPeriod | null
  latestPeriod: ApmPeriod | null
  metrics: PromotionMetric[]
}

type PromotionMetricDefinition = {
  key: PromotionMetricKey
  label: string
  format: PromotionMetricFormat
}

const amount = (value: number) => value * 100

export const PROMOTION_METRIC_DEFINITIONS: PromotionMetricDefinition[] = [
  {
    key: 'net_sales_personal',
    label: '近12个月个人业绩',
    format: 'amount',
  },
  {
    key: 'net_sales_team',
    label: '近12个月团队业绩',
    format: 'amount',
  },
  {
    key: 'net_sales_team_direct',
    label: '近12个月直属团队业绩',
    format: 'amount',
  },
  {
    key: 'net_case_personal',
    label: '近12个月个人保单数',
    format: 'count',
  },
  {
    key: 'num_qualified_team',
    label: '团队合资格人数',
    format: 'count',
  },
  {
    key: 'num_qualified_team_direct',
    label: '直属合资格人数',
    format: 'count',
  },
  {
    key: 'renewal_rate_team_direct',
    label: '团队续保率',
    format: 'percent',
  },
]

export const PROMOTION_TARGETS: Partial<Record<DesignationName, Record<PromotionMetricKey, number>>> = {
  UM: {
    net_sales_personal: amount(820000),
    net_sales_team: 0,
    net_sales_team_direct: 0,
    net_case_personal: 40,
    num_qualified_team: 0,
    num_qualified_team_direct: 0,
    renewal_rate_team_direct: 0,
  },
  SUM: {
    net_sales_personal: amount(280000),
    net_sales_team: amount(1450000),
    net_sales_team_direct: amount(980000),
    net_case_personal: 10,
    num_qualified_team: 4,
    num_qualified_team_direct: 3,
    renewal_rate_team_direct: 80,
  },
  BM: {
    net_sales_personal: amount(280000),
    net_sales_team: amount(2850000),
    net_sales_team_direct: amount(1300000),
    net_case_personal: 10,
    num_qualified_team: 8,
    num_qualified_team_direct: 4,
    renewal_rate_team_direct: 80,
  },
  RM: {
    net_sales_personal: 0,
    net_sales_team: amount(6750000),
    net_sales_team_direct: amount(1950000),
    net_case_personal: 10,
    num_qualified_team: 17,
    num_qualified_team_direct: 6,
    renewal_rate_team_direct: 80,
  },
  SRM: {
    net_sales_personal: 0,
    net_sales_team: amount(13500000),
    net_sales_team_direct: amount(2900000),
    net_case_personal: 0,
    num_qualified_team: 33,
    num_qualified_team_direct: 9,
    renewal_rate_team_direct: 80,
  },
  RD: {
    net_sales_personal: 0,
    net_sales_team: amount(27000000),
    net_sales_team_direct: amount(3900000),
    net_case_personal: 0,
    num_qualified_team: 65,
    num_qualified_team_direct: 12,
    renewal_rate_team_direct: 80,
  },
  SRD: {
    net_sales_personal: 0,
    net_sales_team: amount(40000000),
    net_sales_team_direct: amount(5600000),
    net_case_personal: 0,
    num_qualified_team: 109,
    num_qualified_team_direct: 12,
    renewal_rate_team_direct: 80,
  },
}
