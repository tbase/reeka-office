import { and, count, eq, gte, gt, isNull, or, sql } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agentPointBalances, redemptionProducts, redemptionRecords } from '../schema'

export interface RedeemProductInput {
  productId: number
  agentCode: string
  remark?: string | null
}

export class RedeemProductCommand {
  private readonly db: DB

  constructor(private readonly input: RedeemProductInput) {
    this.db = getDb()
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
          validUntil: redemptionProducts.validUntil,
        })
        .from(redemptionProducts)
        .where(eq(redemptionProducts.id, this.input.productId))
        .limit(1)

      const product = productRows[0]
      if (!product) {
        throw new Error('Redemption product not found')
      }

      if (product.status !== 'published') {
        throw new Error('Redemption product is not published')
      }

      if (product.validUntil && product.validUntil.getTime() < Date.now()) {
        throw new Error('Redemption product is expired')
      }

      const [redeemedRows, balanceRows] = await Promise.all([
        tx
          .select({ value: count() })
          .from(redemptionRecords)
          .where(
            and(
              eq(redemptionRecords.productId, this.input.productId),
              eq(redemptionRecords.agentCode, this.input.agentCode),
              eq(redemptionRecords.status, 'success'),
            ),
          ),
        tx
          .select({ currentPoints: agentPointBalances.currentPoints })
          .from(agentPointBalances)
          .where(eq(agentPointBalances.agentCode, this.input.agentCode))
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
            eq(redemptionProducts.id, this.input.productId),
            gt(redemptionProducts.stock, 0),
            eq(redemptionProducts.status, 'published'),
            or(isNull(redemptionProducts.validUntil), gte(redemptionProducts.validUntil, new Date())),
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
            eq(agentPointBalances.agentCode, this.input.agentCode),
            gte(agentPointBalances.currentPoints, product.redeemPoints),
          ),
        )

      if (balanceUpdateResult.affectedRows === 0) {
        throw new Error('Insufficient points')
      }

      const result = await tx
        .insert(redemptionRecords)
        .values({
          productId: this.input.productId,
          agentCode: this.input.agentCode,
          pointsCost: product.redeemPoints,
          status: 'success',
          remark: this.input.remark ?? null,
        })
        .$returningId()

      return result[0]?.id ?? null
    })
  }
}
