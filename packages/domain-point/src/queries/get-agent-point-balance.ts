import { eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agentPointBalances, type AgentPointBalanceRow } from '../schema'

export interface GetAgentPointBalanceInput {
  agentCode: string
}

export class GetAgentPointBalanceQuery {
  private readonly db: DB

  constructor(private readonly input: GetAgentPointBalanceInput) {
    this.db = getDb()
  }

  async query(): Promise<AgentPointBalanceRow | null> {
    const rows = await this.db
      .select()
      .from(agentPointBalances)
      .where(eq(agentPointBalances.agentCode, this.input.agentCode))
      .limit(1)

    return rows[0] ?? null
  }
}
