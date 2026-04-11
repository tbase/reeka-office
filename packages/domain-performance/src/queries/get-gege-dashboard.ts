import { getDb, type DB } from '../context'
import type { ApmPeriod } from './get-latest-apm-period'
import {
  buildGegeTeamMembers,
  createEmptyMetrics,
  getGegeAgentInfo,
  getGegeMetricsMap,
  getLatestGegePeriod,
  listGegeTeamMemberBase,
  summarizeGegeTeamMembers,
  type GegeAgentInfo,
  type GegeCurrentMetrics,
  type GegeTeamSummary,
} from './gege-shared'

export interface GetGegeDashboardInput {
  agentCode: string
}

export interface GetGegeDashboardResult {
  period: ApmPeriod | null
  agent: GegeAgentInfo
  self: GegeCurrentMetrics
  team: {
    direct: GegeTeamSummary
    all: GegeTeamSummary
  }
}

export class GetGegeDashboardQuery {
  private readonly db: DB
  private readonly input: GetGegeDashboardInput

  constructor(input: GetGegeDashboardInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<GetGegeDashboardResult> {
    const agent = await getGegeAgentInfo(this.db, this.input.agentCode)

    if (!agent) {
      throw new Error(`代理人不存在: ${this.input.agentCode}`)
    }

    const period = await getLatestGegePeriod()
    const [directMembers, allMembers] = await Promise.all([
      listGegeTeamMemberBase(this.db, this.input.agentCode, 'direct'),
      listGegeTeamMemberBase(this.db, this.input.agentCode, 'all'),
    ])

    const currentCodes = [
      this.input.agentCode,
      ...new Set([
        ...directMembers.map((member) => member.agentCode),
        ...allMembers.map((member) => member.agentCode),
      ]),
    ]
    const metricsMap = await getGegeMetricsMap(this.db, currentCodes, period)
    const directTeam = buildGegeTeamMembers(directMembers, metricsMap)
    const allTeam = buildGegeTeamMembers(allMembers, metricsMap)

    return {
      period,
      agent,
      self: metricsMap.get(this.input.agentCode) ?? createEmptyMetrics(),
      team: {
        direct: summarizeGegeTeamMembers(directTeam),
        all: summarizeGegeTeamMembers(allTeam),
      },
    }
  }
}
