import { and, asc, eq } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import type { TenantScope } from '../scope'
import { planTaskCategories } from '../schema'

export interface ListPlanTaskCategoriesInput {
  includeInactive?: boolean
}

export class ListPlanTaskCategoriesQuery {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: ListPlanTaskCategoriesInput

  constructor(scope: TenantScope, input: ListPlanTaskCategoriesInput = {}) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query() {
    const baseQuery = this.db
      .select()
      .from(planTaskCategories)
      .where(eq(planTaskCategories.tenantId, this.scope.tenantId))
      .orderBy(asc(planTaskCategories.displayOrder), asc(planTaskCategories.id))
    if (this.input.includeInactive) {
      return baseQuery
    }

    return this.db
      .select()
      .from(planTaskCategories)
      .where(and(
        eq(planTaskCategories.tenantId, this.scope.tenantId),
        eq(planTaskCategories.isActive, true),
      ))
      .orderBy(asc(planTaskCategories.displayOrder), asc(planTaskCategories.id))
  }
}
