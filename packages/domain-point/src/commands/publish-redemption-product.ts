import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts } from '../schema'
import type { TenantScope } from '../scope'

export interface PublishRedemptionProductInput {
  id: number
}

export class PublishRedemptionProductCommand {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: PublishRedemptionProductInput

  constructor(scope: TenantScope, input: PublishRedemptionProductInput) {
    this.db = getDb()
    this.scope = scope
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
        eq(redemptionProducts.tenantId, this.scope.tenantId),
        eq(redemptionProducts.id, this.input.id),
        eq(redemptionProducts.status, 'draft'),
      ))

    return result.affectedRows > 0
  }
}
