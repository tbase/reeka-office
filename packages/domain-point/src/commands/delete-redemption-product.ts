import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts } from '../schema'

export interface DeleteRedemptionProductInput {
  id: number
}

export class DeleteRedemptionProductCommand {
  private readonly db: DB

  constructor(private readonly input: DeleteRedemptionProductInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(redemptionProducts)
      .where(and(eq(redemptionProducts.id, this.input.id), eq(redemptionProducts.status, 'draft')))

    return result.affectedRows > 0
  }
}
