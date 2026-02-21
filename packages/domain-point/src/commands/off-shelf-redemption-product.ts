import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts } from '../schema'

export interface OffShelfRedemptionProductInput {
  id: number
}

export class OffShelfRedemptionProductCommand {
  private readonly db: DB

  constructor(private readonly input: OffShelfRedemptionProductInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .update(redemptionProducts)
      .set({
        status: 'off_shelf',
        offShelfAt: new Date(),
      })
      .where(and(eq(redemptionProducts.id, this.input.id), eq(redemptionProducts.status, 'published')))

    return result.affectedRows > 0
  }
}
