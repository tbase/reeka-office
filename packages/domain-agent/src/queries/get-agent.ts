import { and, eq, isNull } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { agents } from '../db/schema'
import type { Agent } from '../types'

export interface GetAgentInput {
  agentId: number
}

export type GetAgentResult = Agent | null

export class GetAgentQuery {
  private readonly db: DB
  private readonly input: GetAgentInput

  constructor(input: GetAgentInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<GetAgentResult> {
    const rows = await this.db
      .select({
        id: agents.id,
        agentCode: agents.agentCode,
        name: agents.name,
        joinDate: agents.joinDate,
        designation: agents.designation,
        finacingScheme: agents.finacingScheme,
        leaderCode: agents.leaderCode,
        lastPromotionDate: agents.lastPromotionDate,
        agency: agents.agency,
        division: agents.division,
        branch: agents.branch,
        unit: agents.unit,
      })
      .from(agents)
      .where(and(
        eq(agents.id, this.input.agentId),
        isNull(agents.deletedAt),
      ))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return null
    }

    return {
      ...row,
    }
  }
}
