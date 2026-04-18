import {
  GetAgentPromotionProfileQuery,
  getDesignationName,
  agentHierarchy,
} from '@reeka-office/domain-agent'
import { and, eq, gt, gte, lte, sql, sum } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { apm } from '../schema'
import { ListApmPeriodsQuery, type ApmPeriod } from './list-apm-periods'
import {
  PROMOTION_METRIC_DEFINITIONS,
  PROMOTION_TARGETS,
  type AgentPromotionSnapshot,
  type PromotionMetric,
  type PromotionMetricKey,
} from './promotion-shared'

export interface GetAgentPromotionSnapshotInput {
  agentCode: string
}

type TeamScope = 'all' | 'direct'

type TeamTotals = {
  sales: number
  netCase: number
}

type TeamQualifiedCounts = {
  all: number
  direct: number
}

type LatestAgentMetrics = {
  isQualified: number
  renewalRateTeam: number
}

function normalizeQualifiedCount(value: number | null | undefined): number {
  const safeValue = value ?? 0

  return Math.trunc(safeValue / 100)
}

function normalizeRateValue(value: number | null | undefined): number {
  const safeValue = value ?? 0

  return safeValue / 100
}

export class GetAgentPromotionSnapshotQuery {
  private readonly db: DB
  private readonly input: GetAgentPromotionSnapshotInput

  constructor(input: GetAgentPromotionSnapshotInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<AgentPromotionSnapshot> {
    const agent = await new GetAgentPromotionProfileQuery({
      agentCode: this.input.agentCode,
    }).query()

    if (!agent) {
      throw new Error(`代理人不存在: ${this.input.agentCode}`)
    }

    const actualDesignation = agent.designation
    const targetDesignation = Number.isInteger(actualDesignation)
      ? (actualDesignation as number) + 1
      : null
    const actualDesignationName = getDesignationName(actualDesignation)
    const targetDesignationName = getDesignationName(targetDesignation)
    const targetConfig = targetDesignationName
      ? PROMOTION_TARGETS[targetDesignationName]
      : undefined

    if (!targetDesignationName || !targetConfig) {
      return {
        status: 'no-target',
        agentCode: agent.agentCode,
        designation: {
          actual: actualDesignation,
          actualName: actualDesignationName,
          target: targetDesignation,
          targetName: targetDesignationName,
        },
        lastPromotionDate: agent.lastPromotionDate,
        saleCalculateStartPeriod: null,
        latestPeriod: null,
        metrics: [],
      }
    }

    const latestPeriod = (await new ListApmPeriodsQuery({ limit: 1 }).query())[0] ?? null
    if (!latestPeriod) {
      return {
        status: 'no-performance',
        agentCode: agent.agentCode,
        designation: {
          actual: actualDesignation,
          actualName: actualDesignationName,
          target: targetDesignation,
          targetName: targetDesignationName,
        },
        lastPromotionDate: agent.lastPromotionDate,
        saleCalculateStartPeriod: null,
        latestPeriod: null,
        metrics: [],
      }
    }

    const saleCalculateStartPeriod = resolveSaleCalculateStartPeriod(
      latestPeriod,
      agent.lastPromotionDate,
      agent.joinDate,
    )
    const [personalTotals, teamTotals, directTeamTotals, qualifiedCounts, latestAgentMetrics] = await Promise.all([
      getAgentRangeTotals(this.db, agent.agentCode, saleCalculateStartPeriod, latestPeriod),
      getTeamRangeTotals(this.db, agent.agentCode, saleCalculateStartPeriod, latestPeriod, 'all'),
      getTeamRangeTotals(this.db, agent.agentCode, saleCalculateStartPeriod, latestPeriod, 'direct'),
      getTeamQualifiedCounts(this.db, agent.agentCode, latestPeriod),
      getLatestAgentMetrics(this.db, agent.agentCode, latestPeriod),
    ])

    const metricActuals: Record<PromotionMetricKey, number> = {
      net_sales_personal: personalTotals.sales,
      net_sales_team: personalTotals.sales + teamTotals.sales,
      net_sales_team_direct: personalTotals.sales + directTeamTotals.sales,
      net_case_personal: personalTotals.netCase,
      num_qualified_team: latestAgentMetrics.isQualified + qualifiedCounts.all,
      num_qualified_team_direct: latestAgentMetrics.isQualified + qualifiedCounts.direct,
      renewal_rate_team_direct: latestAgentMetrics.renewalRateTeam,
    }

    const metrics = buildPromotionMetrics(targetConfig, metricActuals)

    return {
      status: 'ready',
      agentCode: agent.agentCode,
      designation: {
        actual: actualDesignation,
        actualName: actualDesignationName,
        target: targetDesignation,
        targetName: targetDesignationName,
      },
      lastPromotionDate: agent.lastPromotionDate,
      saleCalculateStartPeriod,
      latestPeriod,
      metrics,
    }
  }
}

function parseDatePeriod(value: string | null): ApmPeriod | null {
  const matched = value?.match(/^(\d{4})-(\d{2})-\d{2}$/)
  if (!matched) {
    return null
  }

  return {
    year: Number(matched[1]),
    month: Number(matched[2]),
  }
}

function getPeriodIndex(period: ApmPeriod): number {
  return period.year * 12 + period.month
}

function addMonths(period: ApmPeriod, months: number): ApmPeriod {
  const zeroBasedIndex = period.year * 12 + (period.month - 1) + months

  return {
    year: Math.floor(zeroBasedIndex / 12),
    month: (zeroBasedIndex % 12) + 1,
  }
}

function maxPeriod(periods: Array<ApmPeriod | null>): ApmPeriod | null {
  return periods.reduce<ApmPeriod | null>((currentMax, period) => {
    if (!period) {
      return currentMax
    }

    if (!currentMax || getPeriodIndex(period) > getPeriodIndex(currentMax)) {
      return period
    }

    return currentMax
  }, null)
}

function resolveSaleCalculateStartPeriod(
  latestPeriod: ApmPeriod,
  lastPromotionDate: string | null,
  joinDate: string | null,
): ApmPeriod {
  return maxPeriod([
    addMonths(latestPeriod, -11),
    parseDatePeriod(lastPromotionDate),
    parseDatePeriod(joinDate),
  ]) ?? latestPeriod
}

async function getAgentRangeTotals(
  db: DB,
  agentCode: string,
  startPeriod: ApmPeriod,
  endPeriod: ApmPeriod,
): Promise<TeamTotals> {
  const periodIndex = sql<number>`${apm.year} * 12 + ${apm.month}`
  const rows = await db
    .select({
      sales: sql<number>`coalesce(sum(${apm.nsc}), 0) + coalesce(sum(${apm.netAfypAssigned}), 0)`.mapWith(Number),
      netCase: sum(apm.netCase).mapWith(Number),
    })
    .from(apm)
    .where(and(
      eq(apm.agentCode, agentCode),
      gte(periodIndex, getPeriodIndex(startPeriod)),
      lte(periodIndex, getPeriodIndex(endPeriod)),
    ))

  return {
    sales: rows[0]?.sales ?? 0,
    netCase: rows[0]?.netCase ?? 0,
  }
}

async function getTeamRangeTotals(
  db: DB,
  agentCode: string,
  startPeriod: ApmPeriod,
  endPeriod: ApmPeriod,
  scope: TeamScope,
): Promise<TeamTotals> {
  const periodIndex = sql<number>`${apm.year} * 12 + ${apm.month}`
  const rows = await db
    .select({
      sales: sql<number>`coalesce(sum(${apm.nsc}), 0) + coalesce(sum(${apm.netAfypAssigned}), 0)`.mapWith(Number),
      netCase: sum(apm.netCase).mapWith(Number),
    })
    .from(agentHierarchy)
    .innerJoin(apm, eq(agentHierarchy.agentCode, apm.agentCode))
    .where(and(
      eq(agentHierarchy.leaderCode, agentCode),
      scope === 'direct'
        ? eq(agentHierarchy.hierarchy, 1)
        : gt(agentHierarchy.hierarchy, 0),
      gte(periodIndex, getPeriodIndex(startPeriod)),
      lte(periodIndex, getPeriodIndex(endPeriod)),
    ))

  return {
    sales: rows[0]?.sales ?? 0,
    netCase: rows[0]?.netCase ?? 0,
  }
}

async function getTeamQualifiedCounts(
  db: DB,
  agentCode: string,
  latestPeriod: ApmPeriod,
): Promise<TeamQualifiedCounts> {
  const [allRows, directRows] = await Promise.all([
    db
      .select({
        count: sum(apm.isQualified).mapWith(Number),
      })
      .from(agentHierarchy)
      .innerJoin(apm, eq(agentHierarchy.agentCode, apm.agentCode))
      .where(and(
        eq(agentHierarchy.leaderCode, agentCode),
        gt(agentHierarchy.hierarchy, 0),
        eq(apm.year, latestPeriod.year),
        eq(apm.month, latestPeriod.month),
      )),
    db
      .select({
        count: sum(apm.isQualified).mapWith(Number),
      })
      .from(agentHierarchy)
      .innerJoin(apm, eq(agentHierarchy.agentCode, apm.agentCode))
      .where(and(
        eq(agentHierarchy.leaderCode, agentCode),
        eq(agentHierarchy.hierarchy, 1),
        eq(apm.year, latestPeriod.year),
        eq(apm.month, latestPeriod.month),
      )),
  ])

  return {
    all: normalizeQualifiedCount(allRows[0]?.count),
    direct: normalizeQualifiedCount(directRows[0]?.count),
  }
}

async function getLatestAgentMetrics(
  db: DB,
  agentCode: string,
  latestPeriod: ApmPeriod,
): Promise<LatestAgentMetrics> {
  const rows = await db
    .select({
      isQualified: apm.isQualified,
      renewalRateTeam: apm.renewalRateTeam,
    })
    .from(apm)
    .where(and(
      eq(apm.agentCode, agentCode),
      eq(apm.year, latestPeriod.year),
      eq(apm.month, latestPeriod.month),
    ))
    .limit(1)

  return {
    isQualified: normalizeQualifiedCount(rows[0]?.isQualified),
    renewalRateTeam: normalizeRateValue(rows[0]?.renewalRateTeam),
  }
}

function buildPromotionMetrics(
  targets: Record<PromotionMetricKey, number>,
  actuals: Record<PromotionMetricKey, number>,
): PromotionMetric[] {
  return PROMOTION_METRIC_DEFINITIONS
    .map((definition) => {
      const target = targets[definition.key] ?? 0
      if (target <= 0) {
        return null
      }

      const actual = actuals[definition.key] ?? 0

      return {
        key: definition.key,
        label: definition.label,
        format: definition.format,
        actual,
        target,
        difference: actual - target,
        progress: target > 0 ? actual / target : 0,
      } satisfies PromotionMetric
    })
    .filter((metric): metric is PromotionMetric => metric != null)
}
