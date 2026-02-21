import { desc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { pointItems, type PointItemRow } from '../schema'

export interface ListPointItemsInput {
  category?: string
}

export class ListPointItemsQuery {
  private readonly db: DB

  constructor(private readonly input: ListPointItemsInput = {}) {
    this.db = getDb()
  }

  async query(): Promise<PointItemRow[]> {
    const whereClause = this.input.category
      ? eq(pointItems.category, this.input.category)
      : undefined

    return this.db
      .select()
      .from(pointItems)
      .where(whereClause)
      .orderBy(desc(pointItems.createdAt))
  }
}
