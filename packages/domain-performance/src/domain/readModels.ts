import type { PerformanceMetricName, PerformanceMetrics } from './performanceMetrics'

export interface ApmListItem {
  id: number
  agentCode: string
  agentName: string
  year: number
  month: number
  nsc: number
  nscSum: number
  netAfycSum: number
  netAfyp: number
  netAfypSum: number
  netAfypAssigned: number
  netAfypAssignedSum: number
  netCase: number
  netCaseSum: number
  netCaseAssigned: number
  netCaseAssignedSum: number
  isQualified: number
  isQualifiedAssigned: number
  nscHp: number
  nscHpSum: number
  netAfypHp: number
  netAfypHpSum: number
  netAfypH: number
  netAfypHSum: number
  netCaseH: number
  netCaseHSum: number
  renewalRateTeam: number
  qualifiedGap: number | null
  qualifiedGapNextMonth: number | null
  createdAt: Date
  updatedAt: Date
}

export interface ApmYearlyStatItem {
  month: number
  nsc: number
  nscSum: number
  netCase: number
  netCaseSum: number
}

export interface CurrentPerformanceMetricItem extends PerformanceMetrics {
  agentCode: string
}

export interface PerformanceHistoryItem extends PerformanceMetrics {
  year: number
  month: number
  hasData: boolean
}

export interface MonthlyMetricValueItem {
  month: number
  value: number
}

export type { PerformanceMetricName }
