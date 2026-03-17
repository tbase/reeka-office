import { and, count, eq, gte, gt, sql } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agentPointBalances, redemptionProducts, redemptionRecords } from '../schema'
import type { TenantScope } from '../scope'

export interface RedeemProductInput {
  productId: number
  agentId: number
  remark?: string | null
}

export class RedeemProductCommand {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: RedeemProductInput

  constructor(scope: TenantScope, input: RedeemProductInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  private resolveExpiryAt(publishedAt: Date | null, validPeriodMonths: number | null): Date | null {
    if (!publishedAt || !validPeriodMonths) {
      return null
    }

    const expiryAt = new Date(publishedAt)
    expiryAt.setMonth(expiryAt.getMonth() + validPeriodMonths)
    return expiryAt
  }

  async execute(): Promise<number | null> {
    return this.db.transaction(async (tx) => {
      const productRows = await tx
        .select({
          id: redemptionProducts.id,
          status: redemptionProducts.status,
          stock: redemptionProducts.stock,
          redeemPoints: redemptionProducts.redeemPoints,
          maxRedeemPerAgent: redemptionProducts.maxRedeemPerAgent,
          publishedAt: redemptionProducts.publishedAt,
          validPeriodMonths: redemptionProducts.validPeriodMonths,
        })
        .from(redemptionProducts)
        .where(and(
          eq(redemptionProducts.tenantId, this.scope.tenantId),
          eq(redemptionProducts.id, this.input.productId),
        ))
        .limit(1)

      const product = productRows[0]
      if (!product) {
        throw new Error('Redemption product not found')
      }

      if (product.status !== 'published') {
        throw new Error('Redemption product is not published')
      }

      const expiryAt = this.resolveExpiryAt(product.publishedAt, product.validPeriodMonths)
      if (expiryAt && expiryAt.getTime() < Date.now()) {
        throw new Error('Redemption product is expired')
      }

      const [redeemedRows, balanceRows] = await Promise.all([
        tx
          .select({ value: count() })
          .from(redemptionRecords)
          .where(
            and(
              eq(redemptionRecords.tenantId, this.scope.tenantId),
              eq(redemptionRecords.productId, this.input.productId),
              eq(redemptionRecords.agentId, this.input.agentId),
              eq(redemptionRecords.status, 'success'),
            ),
          ),
        tx
          .select({ currentPoints: agentPointBalances.currentPoints })
          .from(agentPointBalances)
          .where(and(
            eq(agentPointBalances.tenantId, this.scope.tenantId),
            eq(agentPointBalances.agentId, this.input.agentId),
          ))
          .limit(1),
      ])

      const redeemedCount = Number(redeemedRows[0]?.value ?? 0)
      if (redeemedCount >= product.maxRedeemPerAgent) {
        throw new Error('Redeem limit reached for this product')
      }

      const balance = balanceRows[0]
      if (!balance || balance.currentPoints < product.redeemPoints) {
        throw new Error('Insufficient points')
      }

      const [stockUpdateResult] = await tx
        .update(redemptionProducts)
        .set({
          stock: sql`${redemptionProducts.stock} - 1`,
        })
        .where(
          and(
            eq(redemptionProducts.tenantId, this.scope.tenantId),
            eq(redemptionProducts.id, this.input.productId),
            gt(redemptionProducts.stock, 0),
            eq(redemptionProducts.status, 'published'),
          ),
        )

      if (stockUpdateResult.affectedRows === 0) {
        throw new Error('Stock not enough')
      }

      const [balanceUpdateResult] = await tx
        .update(agentPointBalances)
        .set({
          currentPoints: sql`${agentPointBalances.currentPoints} - ${product.redeemPoints}`,
        })
        .where(
          and(
            eq(agentPointBalances.tenantId, this.scope.tenantId),
            eq(agentPointBalances.agentId, this.input.agentId),
            gte(agentPointBalances.currentPoints, product.redeemPoints),
          ),
        )

      if (balanceUpdateResult.affectedRows === 0) {
        throw new Error('Insufficient points')
      }

      const result = await tx
        .insert(redemptionRecords)
        .values({
          tenantId: this.scope.tenantId,
          productId: this.input.productId,
          agentId: this.input.agentId,
          pointsCost: product.redeemPoints,
          status: 'success',
          remark: this.input.remark ?? null,
        })
        .$returningId()

      return result[0]?.id ?? null
    })
  }
}
