import { agents } from '@reeka-office/domain-agent'
import { and, asc, desc, eq, inArray, or, sql, sum } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import { toPerformanceMetrics, type PerformanceMetrics, type PerformanceMetricName } from '../domain/performanceMetrics'
import type {
  ApmListItem,
  ApmYearlyStatItem,
  CurrentPerformanceMetricItem,
  MonthlyMetricValueItem,
  PerformanceHistoryItem,
} from '../domain/readModels'
import { periodToIndex, type Period } from '../domain/period'
import type { PerformanceReadRepository } from '../domain/repositories'
import { apm } from '../schema'

export class DrizzlePerformanceReadRepository implements PerformanceReadRepository {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async listPeriods(input: { limit?: number } = {}): Promise<Period[]> {
    const query = this.db
      .select({
        year: apm.year,
        month: apm.month,
      })
      .from(apm)
      .groupBy(apm.year, apm.month)
      .orderBy(desc(apm.year), desc(apm.month))

    const rows = typeof input.limit === 'number'
      ? await query.limit(input.limit)
      : await query

    return rows.map((row) => ({
      year: row.year,
      month: row.month,
    }))
  }

  async listApm(period: Period): Promise<ApmListItem[]> {
    return this.db
      .select({
        id: apm.id,
        agentCode: apm.agentCode,
        agentName: agents.name,
        year: apm.year,
        month: apm.month,
        nsc: apm.nsc,
        nscSum: apm.nscSum,
        netAfycSum: apm.netAfycSum,
        netAfyp: apm.netAfyp,
        netAfypSum: apm.netAfypSum,
        netAfypAssigned: apm.netAfypAssigned,
        netAfypAssignedSum: apm.netAfypAssignedSum,
        netCase: apm.netCase,
        netCaseSum: apm.netCaseSum,
        netCaseAssigned: apm.netCaseAssigned,
        netCaseAssignedSum: apm.netCaseAssignedSum,
        isQualified: apm.isQualified,
        isQualifiedAssigned: apm.isQualifiedAssigned,
        nscHp: apm.nscHp,
        nscHpSum: apm.nscHpSum,
        netAfypHp: apm.netAfypHp,
        netAfypHpSum: apm.netAfypHpSum,
        netAfypH: apm.netAfypH,
        netAfypHSum: apm.netAfypHSum,
        netCaseH: apm.netCaseH,
        netCaseHSum: apm.netCaseHSum,
        renewalRateTeam: apm.renewalRateTeam,
        qualifiedGap: apm.qualifiedGap,
        qualifiedGapNextMonth: apm.qualifiedGapNextMonth,
        createdAt: apm.createdAt,
        updatedAt: apm.updatedAt,
      })
      .from(apm)
      .innerJoin(agents, eq(apm.agentCode, agents.agentCode))
      .where(and(
        eq(apm.year, period.year),
        eq(apm.month, period.month),
      ))
      .orderBy(desc(apm.nsc), asc(apm.agentCode))
  }

  async listApmYearlyStats(year: number): Promise<ApmYearlyStatItem[]> {
    return this.db
      .select({
        month: apm.month,
        nsc: sum(apm.nsc).mapWith(Number),
        nscSum: sum(apm.nscSum).mapWith(Number),
        netCase: sum(apm.netCase).mapWith(Number),
        netCaseSum: sum(apm.netCaseSum).mapWith(Number),
      })
      .from(apm)
      .where(eq(apm.year, year))
      .groupBy(apm.month)
      .orderBy(asc(apm.month))
  }

  async listAvailableYears(agentCode: string): Promise<number[]> {
    const rows = await this.db
      .select({
        year: apm.year,
      })
      .from(apm)
      .where(eq(apm.agentCode, agentCode))
      .groupBy(apm.year)
      .orderBy(desc(apm.year))

    return rows.map((row) => row.year)
  }

  async listCurrentMetrics(agentCodes: string[], period: Period | null): Promise<CurrentPerformanceMetricItem[]> {
    if (!period || agentCodes.length === 0) {
      return []
    }

    const rows = await this.db
      .select({
        agentCode: apm.agentCode,
        nsc: apm.nsc,
        nscSum: apm.nscSum,
        netCase: apm.netCase,
        netCaseSum: apm.netCaseSum,
        isQualified: apm.isQualified,
        qualifiedGap: apm.qualifiedGap,
        netAfyp: apm.netAfyp,
        netAfypSum: apm.netAfypSum,
        netAfycSum: apm.netAfycSum,
        nscHp: apm.nscHp,
        nscHpSum: apm.nscHpSum,
        netAfypHp: apm.netAfypHp,
        netAfypHpSum: apm.netAfypHpSum,
        netAfypH: apm.netAfypH,
        netAfypHSum: apm.netAfypHSum,
        netCaseH: apm.netCaseH,
        netCaseHSum: apm.netCaseHSum,
        renewalRateTeam: apm.renewalRateTeam,
        isQualifiedNextMonth: apm.isQualifiedNextMonth,
        qualifiedGapNextMonth: apm.qualifiedGapNextMonth,
      })
      .from(apm)
      .where(and(
        inArray(apm.agentCode, agentCodes),
        eq(apm.year, period.year),
        eq(apm.month, period.month),
      ))

    return rows.map((row) => ({
      agentCode: row.agentCode,
      ...toPerformanceMetrics(row),
    }))
  }

  async getAgentHistory(agentCode: string, year: number): Promise<PerformanceHistoryItem[]> {
    const rows = await this.db
      .select({
        month: apm.month,
        nsc: apm.nsc,
        nscSum: apm.nscSum,
        netCase: apm.netCase,
        netCaseSum: apm.netCaseSum,
        isQualified: apm.isQualified,
        qualifiedGap: apm.qualifiedGap,
        netAfyp: apm.netAfyp,
        netAfypSum: apm.netAfypSum,
        netAfycSum: apm.netAfycSum,
        nscHp: apm.nscHp,
        nscHpSum: apm.nscHpSum,
        netAfypHp: apm.netAfypHp,
        netAfypHpSum: apm.netAfypHpSum,
        netAfypH: apm.netAfypH,
        netAfypHSum: apm.netAfypHSum,
        netCaseH: apm.netCaseH,
        netCaseHSum: apm.netCaseHSum,
        renewalRateTeam: apm.renewalRateTeam,
        isQualifiedNextMonth: apm.isQualifiedNextMonth,
        qualifiedGapNextMonth: apm.qualifiedGapNextMonth,
      })
      .from(apm)
      .where(and(
        eq(apm.agentCode, agentCode),
        eq(apm.year, year),
      ))
      .orderBy(asc(apm.month))

    const historyByMonth = new Map(rows.map((row) => [row.month, row]))

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      const row = historyByMonth.get(month)

      return {
        year,
        month,
        ...toPerformanceMetrics(row),
        hasData: Boolean(row),
      }
    })
  }

  async listMonthlyMetricValues(
    agentCodes: string[],
    year: number,
    metricName: PerformanceMetricName,
  ): Promise<MonthlyMetricValueItem[]> {
    if (agentCodes.length === 0) {
      return Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        value: 0,
      }))
    }

    const metricColumn = metricName === 'nsc'
      ? apm.nsc
      : apm.netCase

    const rows = await this.db
      .select({
        month: apm.month,
        value: sum(metricColumn).mapWith(Number),
      })
      .from(apm)
      .where(and(
        inArray(apm.agentCode, agentCodes),
        eq(apm.year, year),
      ))
      .groupBy(apm.month)
      .orderBy(asc(apm.month))

    const valueByMonth = new Map(rows.map((row) => [row.month, row.value]))

    return Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      value: valueByMonth.get(index + 1) ?? 0,
    }))
  }

  async getPerformanceMetrics(agentCode: string, period: Period): Promise<PerformanceMetrics | null> {
    const rows = await this.db
      .select({
        nsc: apm.nsc,
        nscSum: apm.nscSum,
        netCase: apm.netCase,
        netCaseSum: apm.netCaseSum,
        isQualified: apm.isQualified,
        qualifiedGap: apm.qualifiedGap,
        netAfyp: apm.netAfyp,
        netAfypSum: apm.netAfypSum,
        netAfycSum: apm.netAfycSum,
        nscHp: apm.nscHp,
        nscHpSum: apm.nscHpSum,
        netAfypHp: apm.netAfypHp,
        netAfypHpSum: apm.netAfypHpSum,
        netAfypH: apm.netAfypH,
        netAfypHSum: apm.netAfypHSum,
        netCaseH: apm.netCaseH,
        netCaseHSum: apm.netCaseHSum,
        renewalRateTeam: apm.renewalRateTeam,
        isQualifiedNextMonth: apm.isQualifiedNextMonth,
        qualifiedGapNextMonth: apm.qualifiedGapNextMonth,
      })
      .from(apm)
      .where(and(
        eq(apm.agentCode, agentCode),
        eq(apm.year, period.year),
        eq(apm.month, period.month),
      ))
      .limit(1)

    const row = rows[0]
    return row ? toPerformanceMetrics(row) : null
  }

  async sumNsc(agentCodes: string[], startPeriod: Period, endPeriod: Period): Promise<number> {
    return this.sumMetric(agentCodes, startPeriod, endPeriod, 'nsc')
  }

  async sumSales(agentCodes: string[], startPeriod: Period, endPeriod: Period): Promise<number> {
    if (agentCodes.length === 0) {
      return 0
    }

    const periodIndex = sql<number>`${apm.year} * 12 + ${apm.month}`
    const rows = await this.db
      .select({
        total: sql<number>`coalesce(sum(${apm.nsc}), 0) + coalesce(sum(${apm.netAfypAssigned}), 0)`.mapWith(Number),
      })
      .from(apm)
      .where(and(
        inArray(apm.agentCode, agentCodes),
        sql`${periodIndex} >= ${periodToIndex(startPeriod)}`,
        sql`${periodIndex} <= ${periodToIndex(endPeriod)}`,
      ))

    return rows[0]?.total ?? 0
  }

  async sumNetCase(agentCodes: string[], startPeriod: Period, endPeriod: Period): Promise<number> {
    return this.sumMetric(agentCodes, startPeriod, endPeriod, 'netCase')
  }

  async countQualified(agentCodes: string[], period: Period): Promise<number> {
    if (agentCodes.length === 0) {
      return 0
    }

    const rows = await this.db
      .select({
        total: sum(apm.isQualified).mapWith(Number),
      })
      .from(apm)
      .where(and(
        inArray(apm.agentCode, agentCodes),
        eq(apm.year, period.year),
        eq(apm.month, period.month),
      ))

    return Math.trunc((rows[0]?.total ?? 0) / 100)
  }

  async getRenewalRate(agentCode: string, period: Period): Promise<number> {
    const rows = await this.db
      .select({
        renewalRateTeam: apm.renewalRateTeam,
      })
      .from(apm)
      .where(and(
        eq(apm.agentCode, agentCode),
        eq(apm.year, period.year),
        eq(apm.month, period.month),
      ))
      .limit(1)

    return Number(rows[0]?.renewalRateTeam ?? 0) / 100
  }

  async listAgentCodesForPeriods(periods: Period[]): Promise<Array<{ agentCode: string; period: Period }>> {
    if (periods.length === 0) {
      return []
    }

    const rows = await this.db
      .select({
        agentCode: apm.agentCode,
        year: apm.year,
        month: apm.month,
      })
      .from(apm)
      .where(or(
        ...periods.map((period) => and(
          eq(apm.year, period.year),
          eq(apm.month, period.month),
        )),
      )!)

    return rows.map((row) => ({
      agentCode: row.agentCode,
      period: {
        year: row.year,
        month: row.month,
      },
    }))
  }

  private async sumMetric(
    agentCodes: string[],
    startPeriod: Period,
    endPeriod: Period,
    metric: 'nsc' | 'netCase',
  ): Promise<number> {
    if (agentCodes.length === 0) {
      return 0
    }

    const metricColumn = metric === 'nsc'
      ? apm.nsc
      : apm.netCase
    const periodIndex = sql<number>`${apm.year} * 12 + ${apm.month}`
    const rows = await this.db
      .select({
        total: sum(metricColumn).mapWith(Number),
      })
      .from(apm)
      .where(and(
        inArray(apm.agentCode, agentCodes),
        sql`${periodIndex} >= ${periodToIndex(startPeriod)}`,
        sql`${periodIndex} <= ${periodToIndex(endPeriod)}`,
      ))

    return rows[0]?.total ?? 0
  }
}
