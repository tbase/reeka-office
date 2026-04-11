import { getDb, type DB } from '../context'
import type { ApmPeriod } from './get-latest-apm-period'
import {
  buildGegeTeamMembers,
  getGegeMetricsMap,
  getLatestGegePeriod,
  listGegeTeamMemberBase,
  summarizeGegeTeamMembers,
  type GegeTeamMemberItem,
  type GegeTeamScope,
  type GegeTeamSummary,
} from './gege-shared'

export interface ListGegeTeamMembersInput {
  leaderCode: string
  scope?: GegeTeamScope
}

export interface ListGegeTeamMembersResult {
  period: ApmPeriod | null
  scope: GegeTeamScope
  summary: GegeTeamSummary
  members: GegeTeamMemberItem[]
}

export class ListGegeTeamMembersQuery {
  private readonly db: DB
  private readonly input: ListGegeTeamMembersInput

  constructor(input: ListGegeTeamMembersInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ListGegeTeamMembersResult> {
    const scope = this.input.scope ?? 'direct'
    const period = await getLatestGegePeriod()
    const members = await listGegeTeamMemberBase(this.db, this.input.leaderCode, scope)
    const metricsMap = await getGegeMetricsMap(
      this.db,
      members.map((member) => member.agentCode),
      period,
    )
    const teamMembers = buildGegeTeamMembers(members, metricsMap)

    return {
      period,
      scope,
      summary: summarizeGegeTeamMembers(teamMembers),
      members: teamMembers,
    }
  }
}
