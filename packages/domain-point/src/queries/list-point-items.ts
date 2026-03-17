import { and, desc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { pointItems, type PointItemRow } from '../schema'
import type { TenantScope } from '../scope'

export interface ListPointItemsInput {
  category?: string
}

export class ListPointItemsQuery {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: ListPointItemsInput

  constructor(scope: TenantScope, input: ListPointItemsInput = {}) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query(): Promise<PointItemRow[]> {
    const filters = [
      eq(pointItems.tenantId, this.scope.tenantId),
      this.input.category ? eq(pointItems.category, this.input.category) : undefined,
    ].filter((item) => item !== undefined)

    const whereClause = filters.length === 1 ? filters[0] : and(...filters)

    return this.db
      .select()
      .from(pointItems)
      .where(whereClause)
      .orderBy(desc(pointItems.createdAt))
  }
}
