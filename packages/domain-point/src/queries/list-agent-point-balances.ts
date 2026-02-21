import { desc } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agentPointBalances, type AgentPointBalanceRow } from '../schema'

export class ListAgentPointBalancesQuery {
  private readonly db: DB

  constructor() {
    this.db = getDb()
  }

  async query(): Promise<AgentPointBalanceRow[]> {
    return this.db
      .select()
      .from(agentPointBalances)
      .orderBy(desc(agentPointBalances.currentPoints))
  }
}
