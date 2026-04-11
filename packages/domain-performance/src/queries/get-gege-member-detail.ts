import { getDb, type DB } from '../context'
import type { ApmPeriod } from './get-latest-apm-period'
import {
  createEmptyMetrics,
  getGegeAgentInfo,
  getGegeMemberRelation,
  getGegeMetricsMap,
  getLatestGegePeriod,
  listGegeAvailableYears,
  listGegeHistory,
  resolveGegeYear,
  type GegeAgentInfo,
  type GegeCurrentMetrics,
  type GegeHistoryItem,
  type GegeRelationLabel,
} from './gege-shared'

export interface GetGegeMemberDetailInput {
  leaderCode: string
  agentCode: string
  year?: number
}

export interface GetGegeMemberDetailResult {
  period: ApmPeriod | null
  availableYears: number[]
  member: GegeAgentInfo
  relation: {
    hierarchy: number
    relationLabel: GegeRelationLabel
  }
  current: GegeCurrentMetrics
  history: GegeHistoryItem[]
}

export class GetGegeMemberDetailQuery {
  private readonly db: DB
  private readonly input: GetGegeMemberDetailInput

  constructor(input: GetGegeMemberDetailInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<GetGegeMemberDetailResult | null> {
    const relation = await getGegeMemberRelation(
      this.db,
      this.input.leaderCode,
      this.input.agentCode,
    )

    if (!relation) {
      return null
    }

    const member = await getGegeAgentInfo(this.db, this.input.agentCode)
    if (!member) {
      return null
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
      member,
      relation,
      current: metricsMap.get(this.input.agentCode) ?? createEmptyMetrics(),
      history: await listGegeHistory(this.db, this.input.agentCode, selectedYear),
    }
  }
}
