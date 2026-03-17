import { and, count, desc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import {
  redemptionProducts,
  redemptionRecords,
  type RedemptionRecordRow,
} from '../schema'

export interface ListAgentRedemptionRecordsInput {
  agentId: number
  productId?: number
}

export interface AgentRedemptionRecordItem extends RedemptionRecordRow {
  productTitle: string
  redeemCategory: string
}

export interface ListAgentRedemptionRecordsResult {
  records: AgentRedemptionRecordItem[]
  total: number
}

export class ListAgentRedemptionRecordsQuery {
  private readonly db: DB
  private readonly input: ListAgentRedemptionRecordsInput

  constructor(input: ListAgentRedemptionRecordsInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ListAgentRedemptionRecordsResult> {
    const whereClause = this.input.productId
      ? and(
          eq(redemptionRecords.agentId, this.input.agentId),
          eq(redemptionRecords.productId, this.input.productId),
        )
      : and(
          eq(redemptionRecords.agentId, this.input.agentId),
        )

    const [rows, totalRows] = await Promise.all([
      this.db
        .select({
          id: redemptionRecords.id,
          productId: redemptionRecords.productId,
          agentId: redemptionRecords.agentId,
          pointsCost: redemptionRecords.pointsCost,
          status: redemptionRecords.status,
          remark: redemptionRecords.remark,
          redeemedAt: redemptionRecords.redeemedAt,
          createdAt: redemptionRecords.createdAt,
          productTitle: redemptionProducts.title,
          redeemCategory: redemptionProducts.redeemCategory,
        })
        .from(redemptionRecords)
        .innerJoin(redemptionProducts, eq(redemptionProducts.id, redemptionRecords.productId))
        .where(whereClause)
        .orderBy(desc(redemptionRecords.redeemedAt)),
      this.db.select({ value: count() }).from(redemptionRecords).where(whereClause),
    ])

    return {
      records: rows,
      total: Number(totalRows[0]?.value ?? 0),
    }
  }
}
