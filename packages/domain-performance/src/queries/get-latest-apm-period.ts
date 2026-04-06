import { desc } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { apm } from '../schema'

export interface ApmPeriod {
  year: number
  month: number
}

export class GetLatestApmPeriodQuery {
  private readonly db: DB

  constructor() {
    this.db = getDb()
  }

  async query(): Promise<ApmPeriod | null> {
    const rows = await this.db
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
      .limit(1)

    return rows[0] ?? null
  }
}
