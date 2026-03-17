import { and, count, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionRecords } from '../schema'
import type { TenantScope } from '../scope'

export interface ListAgentRedeemCountsInput {
  agentId: number
}

export interface AgentRedeemCountItem {
  productId: number
  redeemedCount: number
}

export class ListAgentRedeemCountsQuery {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: ListAgentRedeemCountsInput

  constructor(scope: TenantScope, input: ListAgentRedeemCountsInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query(): Promise<AgentRedeemCountItem[]> {
    const rows = await this.db
      .select({
        productId: redemptionRecords.productId,
        redeemedCount: count(),
      })
      .from(redemptionRecords)
      .where(
        and(
          eq(redemptionRecords.tenantId, this.scope.tenantId),
          eq(redemptionRecords.agentId, this.input.agentId),
          eq(redemptionRecords.status, 'success'),
        ),
      )
      .groupBy(redemptionRecords.productId)

    return rows.map((row) => ({
      productId: row.productId,
      redeemedCount: Number(row.redeemedCount ?? 0),
    }))
  }
}
