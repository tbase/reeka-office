import { and, desc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { redemptionProducts, type RedemptionProductRow } from '../schema'
import type { TenantScope } from '../scope'

export interface ListRedemptionProductsInput {
  status?: 'draft' | 'published' | 'off_shelf'
  redeemCategory?: string
}

export class ListRedemptionProductsQuery {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: ListRedemptionProductsInput

  constructor(scope: TenantScope, input: ListRedemptionProductsInput = {}) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query(): Promise<RedemptionProductRow[]> {
    const filters = [
      eq(redemptionProducts.tenantId, this.scope.tenantId),
      this.input.status ? eq(redemptionProducts.status, this.input.status) : undefined,
      this.input.redeemCategory ? eq(redemptionProducts.redeemCategory, this.input.redeemCategory) : undefined,
    ].filter((item) => item !== undefined)

    const whereClause = filters.length > 0 ? and(...filters) : undefined

    return this.db
      .select()
      .from(redemptionProducts)
      .where(whereClause)
      .orderBy(desc(redemptionProducts.createdAt))
  }
}
