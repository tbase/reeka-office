import { desc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agentPointBalances } from '../schema'
import type { TenantScope } from '../scope'

export interface AgentPointBalanceItem {
  tenantId: number
  agentId: number
  currentPoints: number
  createdAt: Date
  updatedAt: Date
}

export type ListAgentPointBalancesInput = Record<string, never>

export class ListAgentPointBalancesQuery {
  private readonly db: DB
  private readonly scope: TenantScope

  constructor(scope: TenantScope, _input: ListAgentPointBalancesInput = {}) {
    this.db = getDb()
    this.scope = scope
  }

  async query(): Promise<AgentPointBalanceItem[]> {
    return this.db
      .select({
        tenantId: agentPointBalances.tenantId,
        agentId: agentPointBalances.agentId,
        currentPoints: agentPointBalances.currentPoints,
        createdAt: agentPointBalances.createdAt,
        updatedAt: agentPointBalances.updatedAt,
      })
      .from(agentPointBalances)
      .where(eq(agentPointBalances.tenantId, this.scope.tenantId))
      .orderBy(desc(agentPointBalances.currentPoints))
  }
}
