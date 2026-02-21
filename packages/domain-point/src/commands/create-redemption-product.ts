import { getDb, type DB } from '../context'
import { redemptionProducts, type NewRedemptionProductRow } from '../schema'

export interface CreateRedemptionProductInput {
  redeemCategory: string
  title: string
  description?: string | null
  notice?: string | null
  imageUrl?: string | null
  stock: number
  redeemPoints: number
  maxRedeemPerAgent?: number
  validPeriodMonths?: number | null
  createdBy: number
}

export class CreateRedemptionProductCommand {
  private readonly db: DB

  constructor(private readonly input: CreateRedemptionProductInput) {
    this.db = getDb()
  }

  async execute(): Promise<number | null> {
    if (this.input.stock < 0) {
      throw new Error('Stock cannot be negative')
    }

    if (this.input.redeemPoints <= 0) {
      throw new Error('Redeem points must be a positive number')
    }

    if (this.input.validPeriodMonths != null && this.input.validPeriodMonths <= 0) {
      throw new Error('Valid period months must be a positive number')
    }

    const values: NewRedemptionProductRow = {
      redeemCategory: this.input.redeemCategory,
      title: this.input.title,
      description: this.input.description ?? null,
      notice: this.input.notice ?? null,
      imageUrl: this.input.imageUrl ?? null,
      stock: this.input.stock,
      redeemPoints: this.input.redeemPoints,
      maxRedeemPerAgent: this.input.maxRedeemPerAgent ?? 1,
      validPeriodMonths: this.input.validPeriodMonths ?? null,
      createdBy: this.input.createdBy,
      status: 'draft',
      publishedAt: null,
      offShelfAt: null,
    }

    const result = await this.db.insert(redemptionProducts).values(values).$returningId()
    return result[0]?.id ?? null
  }
}
