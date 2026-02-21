import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts } from '../schema'

export interface PublishRedemptionProductInput {
  id: number
}

export class PublishRedemptionProductCommand {
  private readonly db: DB

  constructor(private readonly input: PublishRedemptionProductInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .update(redemptionProducts)
      .set({
        status: 'published',
        publishedAt: new Date(),
        offShelfAt: null,
      })
      .where(and(eq(redemptionProducts.id, this.input.id), eq(redemptionProducts.status, 'draft')))

    return result.affectedRows > 0
  }
}
