import type { Apm } from './apm'
import type { PerformanceMetrics } from './performanceMetrics'
import type {
  ApmListItem,
  ApmYearlyStatItem,
  CurrentPerformanceMetricItem,
  MonthlyMetricValueItem,
  PerformanceHistoryItem,
  PerformanceMetricName,
} from './readModels'
import type { Period } from './period'

export interface ApmRepository {
  findByKeys(keys: Array<{ agentCode: string; period: Period }>): Promise<Apm[]>
  save(apm: Apm): Promise<void>
}

export interface PerformanceReadRepository {
  listPeriods(input?: { limit?: number }): Promise<Period[]>
  listApm(period: Period): Promise<ApmListItem[]>
  listApmYearlyStats(year: number): Promise<ApmYearlyStatItem[]>
  listAvailableYears(agentCode: string): Promise<number[]>
  listCurrentMetrics(agentCodes: string[], period: Period | null): Promise<CurrentPerformanceMetricItem[]>
  getAgentHistory(agentCode: string, year: number): Promise<PerformanceHistoryItem[]>
  listMonthlyMetricValues(
    agentCodes: string[],
    year: number,
    metricName: PerformanceMetricName,
  ): Promise<MonthlyMetricValueItem[]>
  getPerformanceMetrics(agentCode: string, period: Period): Promise<PerformanceMetrics | null>
  sumNsc(agentCodes: string[], startPeriod: Period, endPeriod: Period): Promise<number>
  sumSales(agentCodes: string[], startPeriod: Period, endPeriod: Period): Promise<number>
  sumNetCase(agentCodes: string[], startPeriod: Period, endPeriod: Period): Promise<number>
  countQualified(agentCodes: string[], period: Period): Promise<number>
  getRenewalRate(agentCode: string, period: Period): Promise<number>
  listAgentCodesForPeriods(periods: Period[]): Promise<Array<{ agentCode: string; period: Period }>>
}
