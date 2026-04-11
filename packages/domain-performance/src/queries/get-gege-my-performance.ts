import { getDb, type DB } from '../context'
import type { ApmPeriod } from './get-latest-apm-period'
import {
  createEmptyMetrics,
  getGegeAgentInfo,
  getGegeMetricsMap,
  getLatestGegePeriod,
  listGegeAvailableYears,
  listGegeHistory,
  resolveGegeYear,
  type GegeAgentInfo,
  type GegeCurrentMetrics,
  type GegeHistoryItem,
} from './gege-shared'

export interface GetGegeMyPerformanceInput {
  agentCode: string
  year?: number
}

export interface GetGegeMyPerformanceResult {
  period: ApmPeriod | null
  availableYears: number[]
  agent: GegeAgentInfo
  current: GegeCurrentMetrics
  history: GegeHistoryItem[]
}

export class GetGegeMyPerformanceQuery {
  private readonly db: DB
  private readonly input: GetGegeMyPerformanceInput

  constructor(input: GetGegeMyPerformanceInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<GetGegeMyPerformanceResult> {
    const agent = await getGegeAgentInfo(this.db, this.input.agentCode)

    if (!agent) {
      throw new Error(`代理人不存在: ${this.input.agentCode}`)
    }

    const [period, availableYears] = await Promise.all([
      getLatestGegePeriod(),
      listGegeAvailableYears(this.db, this.input.agentCode),
    ])
    const selectedYear = resolveGegeYear(availableYears, this.input.year, period)
    const metricsMap = await getGegeMetricsMap(this.db, [this.input.agentCode], period)

    return {
      period,
      availableYears,
      agent,
      current: metricsMap.get(this.input.agentCode) ?? createEmptyMetrics(),
      history: await listGegeHistory(this.db, this.input.agentCode, selectedYear),
    }
  }
}
