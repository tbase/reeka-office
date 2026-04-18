import { desc } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { apm } from '../schema'

export interface ApmPeriod {
  year: number
  month: number
}

export interface ListApmPeriodsInput {
  limit?: number
}

export class ListApmPeriodsQuery {
  private readonly db: DB
  private readonly input: ListApmPeriodsInput

  constructor(input: ListApmPeriodsInput = {}) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ApmPeriod[]> {
    const query = this.db
      .select({
        year: apm.year,
        month: apm.month,
      })
      .from(apm)
      .groupBy(apm.year, apm.month)
      .orderBy(
        desc(apm.year),
        desc(apm.month),
      )

    return typeof this.input.limit === 'number'
      ? query.limit(this.input.limit)
      : query
  }
}
