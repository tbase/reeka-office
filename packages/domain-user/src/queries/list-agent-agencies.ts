import { asc, eq } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { agents } from '../db/schema'

export interface ListAgentAgenciesInput {
  tenantId: number
}

export type ListAgentAgenciesResult = string[]

export class ListAgentAgenciesQuery {
  private readonly db: DB
  private readonly input: ListAgentAgenciesInput

  constructor(input: ListAgentAgenciesInput) {
    this.input = input
    this.db = getDb()
  }

  async query(): Promise<ListAgentAgenciesResult> {
    const rows = await this.db
      .select({
        agency: agents.agency,
      })
      .from(agents)
      .where(eq(agents.tenantId, this.input.tenantId))
      .groupBy(agents.agency)
      .orderBy(asc(agents.agency))

    return rows
      .map((row) => row.agency?.trim() ?? '')
      .filter((agency) => agency.length > 0)
  }
}
