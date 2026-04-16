import { asc, isNull } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { agents } from '../db/schema'

export interface ListAgentAgenciesInput {}

export type ListAgentAgenciesResult = string[]

export class ListAgentAgenciesQuery {
  private readonly db: DB

  constructor(_input: ListAgentAgenciesInput = {}) {
    this.db = getDb()
  }

  async query(): Promise<ListAgentAgenciesResult> {
    const rows = await this.db
      .select({
        agency: agents.agency,
      })
      .from(agents)
      .where(isNull(agents.deletedAt))
      .groupBy(agents.agency)
      .orderBy(asc(agents.agency))

    return rows
      .map((row) => row.agency?.trim() ?? '')
      .filter((agency) => agency.length > 0)
  }
}
