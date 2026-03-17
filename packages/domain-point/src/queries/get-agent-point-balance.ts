import { eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agentPointBalances, type AgentPointBalanceRow } from '../schema'

export interface GetAgentPointBalanceInput {
  agentId: number
}

export class GetAgentPointBalanceQuery {
  private readonly db: DB
  private readonly input: GetAgentPointBalanceInput

  constructor(input: GetAgentPointBalanceInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<AgentPointBalanceRow | null> {
    const rows = await this.db
      .select()
      .from(agentPointBalances)
      .where(eq(agentPointBalances.agentId, this.input.agentId))
      .limit(1)

    return rows[0] ?? null
  }
}
