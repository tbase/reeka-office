import { asc, eq } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { planTaskCategories } from '../schema'

export interface ListPlanTaskCategoriesInput {
  includeInactive?: boolean
}

export class ListPlanTaskCategoriesQuery {
  private readonly db: DB

  constructor(private readonly input: ListPlanTaskCategoriesInput = {}) {
    this.db = getDb()
  }

  async query() {
    const baseQuery = this.db
      .select()
      .from(planTaskCategories)
      .orderBy(asc(planTaskCategories.displayOrder), asc(planTaskCategories.id))

    if (this.input.includeInactive) {
      return baseQuery
    }

    return baseQuery.where(eq(planTaskCategories.isActive, true))
  }
}
