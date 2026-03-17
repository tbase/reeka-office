import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts } from '../schema'

export interface DeleteRedemptionProductInput {
  id: number
}

export class DeleteRedemptionProductCommand {
  private readonly db: DB
  private readonly input: DeleteRedemptionProductInput

  constructor(input: DeleteRedemptionProductInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(redemptionProducts)
      .where(and(
        eq(redemptionProducts.id, this.input.id),
        eq(redemptionProducts.status, 'draft'),
      ))

    return result.affectedRows > 0
  }
}
