import { and, eq, isNull } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { agents } from '../db/schema'

export interface AgentPromotionProfile {
  agentCode: string
  designation: number | null
  joinDate: string | null
  lastPromotionDate: string | null
}

export interface GetAgentPromotionProfileInput {
  agentCode: string
}

export type GetAgentPromotionProfileResult = AgentPromotionProfile | null

export class GetAgentPromotionProfileQuery {
  private readonly db: DB
  private readonly input: GetAgentPromotionProfileInput

  constructor(input: GetAgentPromotionProfileInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<GetAgentPromotionProfileResult> {
    const rows = await this.db
      .select({
        agentCode: agents.agentCode,
        designation: agents.designation,
        joinDate: agents.joinDate,
        lastPromotionDate: agents.lastPromotionDate,
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
      designation: row.designation,
      joinDate: row.joinDate,
      lastPromotionDate: row.lastPromotionDate,
    }
  }
}
