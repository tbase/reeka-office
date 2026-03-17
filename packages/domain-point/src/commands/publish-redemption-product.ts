import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts } from '../schema'

export interface PublishRedemptionProductInput {
  id: number
}

export class PublishRedemptionProductCommand {
  private readonly db: DB
  private readonly input: PublishRedemptionProductInput

  constructor(input: PublishRedemptionProductInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .update(redemptionProducts)
      .set({
        status: 'published',
        publishedAt: new Date(),
        offShelfAt: null,
      })
      .where(and(
        eq(redemptionProducts.id, this.input.id),
        eq(redemptionProducts.status, 'draft'),
      ))

    return result.affectedRows > 0
  }
}
