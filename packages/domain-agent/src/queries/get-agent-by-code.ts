import { and, eq, isNull } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { agents } from '../db/schema'

export interface AgentProfile {
  agentCode: string
  name: string
  designation: number | null
  leaderCode: string | null
  division: string | null
}

export interface GetAgentByCodeInput {
  agentCode: string
}

export type GetAgentByCodeResult = AgentProfile | null

export class GetAgentByCodeQuery {
  private readonly db: DB
  private readonly input: GetAgentByCodeInput

  constructor(input: GetAgentByCodeInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<GetAgentByCodeResult> {
    const rows = await this.db
      .select({
        agentCode: agents.agentCode,
        name: agents.name,
        designation: agents.designation,
        leaderCode: agents.leaderCode,
        division: agents.division,
      })
      .from(agents)
      .where(and(
        eq(agents.agentCode, this.input.agentCode),
        isNull(agents.deletedAt),
      ))
      .limit(1)

    const row = rows[0]
    if (!row?.agentCode) {
      return null
    }

    return {
      agentCode: row.agentCode,
      name: row.name,
      designation: row.designation,
      leaderCode: row.leaderCode,
      division: row.division,
    }
  }
}
