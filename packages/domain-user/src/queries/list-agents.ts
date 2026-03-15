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
        id: agents.id,
        agentCode: agents.agentCode,
        name: agents.name,
        joinDate: agents.joinDate,
        designation: agents.designation,
      })
      .from(agents)
      .orderBy(asc(agents.id))

    return rows.map((row) => ({
      id: row.id,
      agentCode: row.agentCode,
      name: row.name,
      joinDate: row.joinDate,
      designation: row.designation,
    }))
  }
}
