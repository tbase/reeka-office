import { and, count, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionRecords } from '../schema'

export interface ListAgentRedeemCountsInput {
  agentId: number
}

export interface AgentRedeemCountItem {
  productId: number
  redeemedCount: number
}

export class ListAgentRedeemCountsQuery {
  private readonly db: DB
  private readonly input: ListAgentRedeemCountsInput

  constructor(input: ListAgentRedeemCountsInput) {
    this.db = getDb()
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
