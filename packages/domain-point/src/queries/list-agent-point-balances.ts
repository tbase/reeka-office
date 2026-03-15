import { desc } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agentPointBalances } from '../schema'

export interface AgentPointBalanceItem {
  agentId: number
  currentPoints: number
  createdAt: Date
  updatedAt: Date
}

export class ListAgentPointBalancesQuery {
  private readonly db: DB

  constructor() {
    this.db = getDb()
  }

  async query(): Promise<AgentPointBalanceItem[]> {
    return this.db
      .select({
        agentId: agentPointBalances.agentId,
        currentPoints: agentPointBalances.currentPoints,
        createdAt: agentPointBalances.createdAt,
        updatedAt: agentPointBalances.updatedAt,
      })
      .from(agentPointBalances)
      .orderBy(desc(agentPointBalances.currentPoints))
  }
}
