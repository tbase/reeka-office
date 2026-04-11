import { agentHierarchy } from '@reeka-office/domain-agent'
import { and, asc, eq, gt, inArray, sum } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { apm } from '../schema'
import {
  GetLatestApmPeriodQuery,
  type ApmPeriod,
} from './get-latest-apm-period'

export type AgentMetricScope = 'self' | 'direct' | 'all'
export type AgentMetricName = 'nsc' | 'netCase'

export interface AgentMonthlyMetricItem {
  month: number
  value: number
}

export interface ListAgentMonthlyMetricsInput {
  agentCode: string
  year: number
  metricName: AgentMetricName
  scope: AgentMetricScope
}

export interface ListAgentMonthlyMetricsResult {
  period: ApmPeriod | null
  year: number
  metricName: AgentMetricName
  scope: AgentMetricScope
  items: AgentMonthlyMetricItem[]
}

async function listTeamAgentCodes(
  db: DB,
  leaderCode: string,
  scope: Exclude<AgentMetricScope, 'self'>,
): Promise<string[]> {
  const rows = await db
    .select({
      agentCode: agentHierarchy.agentCode,
    })
    .from(agentHierarchy)
    .where(and(
      eq(agentHierarchy.leaderCode, leaderCode),
      scope === 'direct'
        ? eq(agentHierarchy.hierarchy, 1)
        : gt(agentHierarchy.hierarchy, 0),
    ))
    .orderBy(
      asc(agentHierarchy.hierarchy),
      asc(agentHierarchy.agentCode),
    )

  return rows
    .map((row) => row.agentCode)
    .filter((agentCode): agentCode is string => !!agentCode)
}

async function listMonthlyMetricItemsByAgentCodes(
  db: DB,
  agentCodes: string[],
  year: number,
  metricName: AgentMetricName,
): Promise<AgentMonthlyMetricItem[]> {
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

export class ListAgentMonthlyMetricsQuery {
  private readonly db: DB
  private readonly input: ListAgentMonthlyMetricsInput

  constructor(input: ListAgentMonthlyMetricsInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ListAgentMonthlyMetricsResult> {
    const period = await new GetLatestApmPeriodQuery().query()
    const agentCodes = this.input.scope === 'self'
      ? [this.input.agentCode]
      : await listTeamAgentCodes(this.db, this.input.agentCode, this.input.scope)

    return {
      period,
      year: this.input.year,
      metricName: this.input.metricName,
      scope: this.input.scope,
      items: await listMonthlyMetricItemsByAgentCodes(
        this.db,
        agentCodes,
        this.input.year,
        this.input.metricName,
      ),
    }
  }
}
