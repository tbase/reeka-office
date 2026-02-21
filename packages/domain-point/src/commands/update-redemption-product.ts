import { eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts, type NewRedemptionProductRow } from '../schema'

export interface UpdateRedemptionProductInput {
  id: number
  redeemCategory?: string
  title?: string
  description?: string | null
  notice?: string | null
  imageUrl?: string | null
  stock?: number
  redeemPoints?: number
  maxRedeemPerAgent?: number
  validPeriodMonths?: number | null
}

export class UpdateRedemptionProductCommand {
  private readonly db: DB

  constructor(private readonly input: UpdateRedemptionProductInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const existingRows = await this.db
      .select({ status: redemptionProducts.status })
      .from(redemptionProducts)
      .where(eq(redemptionProducts.id, this.input.id))
      .limit(1)

    const existing = existingRows[0]
    if (!existing) {
      throw new Error('Redemption product not found')
    }

    if (existing.status !== 'draft') {
      throw new Error('Only draft products can be modified')
    }

    if (this.input.stock !== undefined && this.input.stock < 0) {
      throw new Error('Stock cannot be negative')
    }

    if (this.input.redeemPoints !== undefined && this.input.redeemPoints <= 0) {
      throw new Error('Redeem points must be a positive number')
    }

    if (this.input.maxRedeemPerAgent !== undefined && this.input.maxRedeemPerAgent <= 0) {
      throw new Error('Max redeem per agent must be a positive number')
    }

    if (this.input.validPeriodMonths != null && this.input.validPeriodMonths <= 0) {
      throw new Error('Valid period months must be a positive number')
    }

    const values: Partial<NewRedemptionProductRow> = {
      redeemCategory: this.input.redeemCategory,
      title: this.input.title,
      description: this.input.description,
      notice: this.input.notice,
      imageUrl: this.input.imageUrl,
      stock: this.input.stock,
      redeemPoints: this.input.redeemPoints,
      maxRedeemPerAgent: this.input.maxRedeemPerAgent,
      validPeriodMonths: this.input.validPeriodMonths,
    }

    const [result] = await this.db
      .update(redemptionProducts)
      .set(values)
      .where(eq(redemptionProducts.id, this.input.id))

    return result.affectedRows > 0
  }
}
