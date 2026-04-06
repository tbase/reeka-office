import { asc, eq, sum } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { apm } from '../schema'

export interface ListApmYearlyStatsInput {
  year: number
}

export interface ApmYearlyStatItem {
  month: number
  nsc: number
  nscSum: number
  netCase: number
  netCaseSum: number
}

export class ListApmYearlyStatsQuery {
  private readonly db: DB
  private readonly input: ListApmYearlyStatsInput

  constructor(input: ListApmYearlyStatsInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ApmYearlyStatItem[]> {
    return this.db
      .select({
        month: apm.month,
        nsc: sum(apm.nsc).mapWith(Number),
        nscSum: sum(apm.nscSum).mapWith(Number),
        netCase: sum(apm.netCase).mapWith(Number),
        netCaseSum: sum(apm.netCaseSum).mapWith(Number),
      })
      .from(apm)
      .where(eq(apm.year, this.input.year))
      .groupBy(apm.month)
      .orderBy(asc(apm.month))
  }
}
