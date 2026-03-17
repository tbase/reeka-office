import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts } from '../schema'
import type { TenantScope } from '../scope'

export interface DeleteRedemptionProductInput {
  id: number
}

export class DeleteRedemptionProductCommand {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: DeleteRedemptionProductInput

  constructor(scope: TenantScope, input: DeleteRedemptionProductInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(redemptionProducts)
      .where(and(
        eq(redemptionProducts.tenantId, this.scope.tenantId),
        eq(redemptionProducts.id, this.input.id),
        eq(redemptionProducts.status, 'draft'),
      ))

    return result.affectedRows > 0
  }
}
