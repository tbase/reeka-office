import { asc } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { newbieTaskCategories, type NewbieTaskCategoryRow } from '../schema'

export class ListNewbieTaskCategoriesQuery {
  private readonly db: DB

  constructor() {
    this.db = getDb()
  }

  async query(): Promise<NewbieTaskCategoryRow[]> {
    return this.db
      .select()
      .from(newbieTaskCategories)
      .orderBy(asc(newbieTaskCategories.name))
  }
}
