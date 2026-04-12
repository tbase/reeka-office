import { and, eq } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { agentHierarchy } from '../db/schema'

export interface GetTeamMemberRelationInput {
  leaderCode: string
  agentCode: string
}

export interface GetTeamMemberRelationResult {
  hierarchy: number
}

export class GetTeamMemberRelationQuery {
  private readonly db: DB
  private readonly input: GetTeamMemberRelationInput

  constructor(input: GetTeamMemberRelationInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<GetTeamMemberRelationResult | null> {
    const rows = await this.db
      .select({
        hierarchy: agentHierarchy.hierarchy,
      })
      .from(agentHierarchy)
      .where(and(
        eq(agentHierarchy.leaderCode, this.input.leaderCode),
        eq(agentHierarchy.agentCode, this.input.agentCode),
      ))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return null
    }

    return {
      hierarchy: row.hierarchy,
    }
  }
}
