import { and, count, desc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import {
  redemptionProducts,
  redemptionRecords,
  type RedemptionRecordRow,
} from '../schema'
import type { TenantScope } from '../scope'

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
  private readonly scope: TenantScope
  private readonly input: ListAgentRedemptionRecordsInput

  constructor(scope: TenantScope, input: ListAgentRedemptionRecordsInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query(): Promise<ListAgentRedemptionRecordsResult> {
    const whereClause = this.input.productId
      ? and(
          eq(redemptionRecords.tenantId, this.scope.tenantId),
          eq(redemptionRecords.agentId, this.input.agentId),
          eq(redemptionRecords.productId, this.input.productId),
        )
      : and(
          eq(redemptionRecords.tenantId, this.scope.tenantId),
          eq(redemptionRecords.agentId, this.input.agentId),
        )

    const [rows, totalRows] = await Promise.all([
      this.db
        .select({
          id: redemptionRecords.id,
          tenantId: redemptionRecords.tenantId,
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
        .innerJoin(redemptionProducts, and(
          eq(redemptionProducts.id, redemptionRecords.productId),
          eq(redemptionProducts.tenantId, this.scope.tenantId),
        ))
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
