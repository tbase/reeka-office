import { desc } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { apm } from '../schema'
import type { ApmPeriod } from './get-latest-apm-period'

export class ListApmPeriodsQuery {
  private readonly db: DB

  constructor() {
    this.db = getDb()
  }

  async query(): Promise<ApmPeriod[]> {
    return this.db
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
  }
}
