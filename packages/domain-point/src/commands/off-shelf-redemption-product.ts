import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts } from '../schema'
import type { TenantScope } from '../scope'

export interface OffShelfRedemptionProductInput {
  id: number
}

export class OffShelfRedemptionProductCommand {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: OffShelfRedemptionProductInput

  constructor(scope: TenantScope, input: OffShelfRedemptionProductInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .update(redemptionProducts)
      .set({
        status: 'off_shelf',
        offShelfAt: new Date(),
      })
      .where(and(
        eq(redemptionProducts.tenantId, this.scope.tenantId),
        eq(redemptionProducts.id, this.input.id),
        eq(redemptionProducts.status, 'published'),
      ))

    return result.affectedRows > 0
  }
}
