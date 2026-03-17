import { and, asc, eq } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { planTaskCategories } from '../schema'

export interface ListPlanTaskCategoriesInput {
  includeInactive?: boolean
}

export class ListPlanTaskCategoriesQuery {
  private readonly db: DB
  private readonly input: ListPlanTaskCategoriesInput

  constructor(input: ListPlanTaskCategoriesInput = {}) {
    this.db = getDb()
    this.input = input
  }

  async query() {
    const baseQuery = this.db
      .select()
      .from(planTaskCategories)
      .orderBy(asc(planTaskCategories.displayOrder), asc(planTaskCategories.id))
    if (this.input.includeInactive) {
      return baseQuery
    }

    return this.db
      .select()
      .from(planTaskCategories)
      .where(eq(planTaskCategories.isActive, true))
      .orderBy(asc(planTaskCategories.displayOrder), asc(planTaskCategories.id))
  }
}
