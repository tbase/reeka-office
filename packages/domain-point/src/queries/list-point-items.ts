import { and, desc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { pointItems, type PointItemRow } from '../schema'

export interface ListPointItemsInput {
  category?: string
}

export class ListPointItemsQuery {
  private readonly db: DB
  private readonly input: ListPointItemsInput

  constructor(input: ListPointItemsInput = {}) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<PointItemRow[]> {
    const filters = [
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
