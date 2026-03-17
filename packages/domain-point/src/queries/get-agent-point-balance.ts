import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agentPointBalances, type AgentPointBalanceRow } from '../schema'
import type { TenantScope } from '../scope'

export interface GetAgentPointBalanceInput {
  agentId: number
}

export class GetAgentPointBalanceQuery {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: GetAgentPointBalanceInput

  constructor(scope: TenantScope, input: GetAgentPointBalanceInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query(): Promise<AgentPointBalanceRow | null> {
    const rows = await this.db
      .select()
      .from(agentPointBalances)
      .where(and(
        eq(agentPointBalances.tenantId, this.scope.tenantId),
        eq(agentPointBalances.agentId, this.input.agentId),
      ))
      .limit(1)

    return rows[0] ?? null
  }
}
