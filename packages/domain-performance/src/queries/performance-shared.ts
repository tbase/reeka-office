import { and, asc, desc, eq, inArray, sum } from 'drizzle-orm'

import type { DB } from '../context'
import { apm } from '../schema'
import type { ApmPeriod } from './list-apm-periods'

export interface PerformanceMetrics {
  nsc: number
  nscSum: number
  netCase: number
  netCaseSum: number
  isQualified: boolean
  qualifiedGap: number | null
  netAfyp: number
  netAfypSum: number
  netAfycSum: number
  nscHp: number
  nscHpSum: number
  netAfypHp: number
  netAfypHpSum: number
  netAfypH: number
  netAfypHSum: number
  netCaseH: number
  netCaseHSum: number
  renewalRateTeam: number
  isQualifiedNextMonth: boolean | null
  qualifiedGapNextMonth: number | null
}

export interface PerformanceHistoryItem extends PerformanceMetrics {
  year: number
  month: number
  hasData: boolean
}

export interface CurrentPerformanceMetricItem extends PerformanceMetrics {
  agentCode: string
}

export type PerformanceMetricName = 'nsc' | 'netCase'

export interface MonthlyMetricValueItem {
  month: number
  value: number
}

type PerformanceMetricRow = {
  agentCode: string
  nsc: number
  nscSum: number
  netCase: number
  netCaseSum: number
  isQualified: number
  qualifiedGap: number | null
  netAfyp: number
  netAfypSum: number
  netAfycSum: number
  nscHp: number
  nscHpSum: number
  netAfypHp: number
  netAfypHpSum: number
  netAfypH: number
  netAfypHSum: number
  netCaseH: number
  netCaseHSum: number
  renewalRateTeam: number
  isQualifiedNextMonth: boolean | null
  qualifiedGapNextMonth: number | null
}

type PerformanceHistoryRow = Omit<PerformanceMetricRow, 'agentCode'>

export function createEmptyPerformanceMetrics(): PerformanceMetrics {
  return {
    nsc: 0,
    nscSum: 0,
    netCase: 0,
    netCaseSum: 0,
    isQualified: false,
    qualifiedGap: null,
    netAfyp: 0,
    netAfypSum: 0,
    netAfycSum: 0,
    nscHp: 0,
    nscHpSum: 0,
    netAfypHp: 0,
    netAfypHpSum: 0,
    netAfypH: 0,
    netAfypHSum: 0,
    netCaseH: 0,
    netCaseHSum: 0,
    renewalRateTeam: 0,
    isQualifiedNextMonth: null,
    qualifiedGapNextMonth: null,
  }
}

function toQualifiedFlag(value: boolean | number | null | undefined): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  return Number(value) > 0
}

function mapPerformanceMetrics(
  row?: Omit<PerformanceMetricRow, 'agentCode'> | null,
): PerformanceMetrics {
  if (!row) {
    return createEmptyPerformanceMetrics()
  }

  return {
    nsc: row.nsc,
    nscSum: row.nscSum,
    netCase: row.netCase,
    netCaseSum: row.netCaseSum,
    isQualified: toQualifiedFlag(row.isQualified),
    qualifiedGap: row.qualifiedGap,
    netAfyp: row.netAfyp,
    netAfypSum: row.netAfypSum,
    netAfycSum: row.netAfycSum,
    nscHp: row.nscHp,
    nscHpSum: row.nscHpSum,
    netAfypHp: row.netAfypHp,
    netAfypHpSum: row.netAfypHpSum,
    netAfypH: row.netAfypH,
    netAfypHSum: row.netAfypHSum,
    netCaseH: row.netCaseH,
    netCaseHSum: row.netCaseHSum,
    renewalRateTeam: row.renewalRateTeam,
    isQualifiedNextMonth: row.isQualifiedNextMonth == null
      ? null
      : toQualifiedFlag(row.isQualifiedNextMonth),
    qualifiedGapNextMonth: row.qualifiedGapNextMonth,
  }
}

function mapPerformanceHistoryItem(
  year: number,
  month: number,
  row?: PerformanceHistoryRow | null,
): PerformanceHistoryItem {
  return {
    year,
    month,
    ...(mapPerformanceMetrics(row)),
    hasData: Boolean(row),
  }
}

export async function listAvailablePerformanceYears(
  db: DB,
  agentCode: string,
): Promise<number[]> {
  const rows = await db
    .select({
      year: apm.year,
    })
    .from(apm)
    .where(eq(apm.agentCode, agentCode))
    .groupBy(apm.year)
    .orderBy(desc(apm.year))

  return rows.map((row) => row.year)
}

export function resolvePerformanceYear(
  availableYears: number[],
  requestedYear?: number,
  fallbackPeriod?: ApmPeriod | null,
): number {
  if (
    typeof requestedYear === 'number'
    && Number.isInteger(requestedYear)
    && availableYears.includes(requestedYear)
  ) {
    return requestedYear
  }

  return availableYears[0] ?? fallbackPeriod?.year ?? new Date().getFullYear()
}

export async function listCurrentPerformanceMetrics(
  db: DB,
  agentCodes: string[],
  period: ApmPeriod | null,
): Promise<CurrentPerformanceMetricItem[]> {
  if (!period || agentCodes.length === 0) {
    return []
  }

  const rows = await db
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
    ...mapPerformanceMetrics(row),
  }))
}

export async function listAgentPerformanceHistory(
  db: DB,
  agentCode: string,
  year: number,
): Promise<PerformanceHistoryItem[]> {
  const rows = await db
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

  const historyByMonth = new Map(
    rows.map((row) => [row.month, row]),
  )

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1

    return mapPerformanceHistoryItem(year, month, historyByMonth.get(month))
  })
}

export async function listMonthlyMetricValues(
  db: DB,
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

  const rows = await db
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

  const valueByMonth = new Map(
    rows.map((row) => [row.month, row.value]),
  )

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1

    return {
      month,
      value: valueByMonth.get(month) ?? 0,
    }
  })
}
