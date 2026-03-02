import { asc } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agents } from '../db/schema'
import type { Agent } from '../types'

export type ListAgentsResult = Agent[]

export class ListAgentsQuery {
  private readonly db: DB

  constructor() {
    this.db = getDb()
  }

  async query(): Promise<ListAgentsResult> {
    const rows = await this.db
      .select({
        agentCode: agents.agentCode,
        name: agents.name,
      })
      .from(agents)
      .orderBy(asc(agents.agentCode))

    return rows.map((row) => ({
      agentCode: row.agentCode,
      name: row.name,
    }))
  }
}
