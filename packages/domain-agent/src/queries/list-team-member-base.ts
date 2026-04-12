import { and, asc, eq, gt } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { agentHierarchy, agents } from '../db/schema'

export type TeamScope = 'direct' | 'all'

export interface TeamMemberBaseItem {
  agentCode: string
  name: string
  designation: number | null
  leaderCode: string | null
  hierarchy: number
}

export interface ListTeamMemberBaseInput {
  leaderCode: string
  scope: TeamScope
}

export type ListTeamMemberBaseResult = TeamMemberBaseItem[]

export class ListTeamMemberBaseQuery {
  private readonly db: DB
  private readonly input: ListTeamMemberBaseInput

  constructor(input: ListTeamMemberBaseInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ListTeamMemberBaseResult> {
    const rows = await this.db
      .select({
        agentCode: agentHierarchy.agentCode,
        name: agents.name,
        designation: agents.designation,
        leaderCode: agents.leaderCode,
        hierarchy: agentHierarchy.hierarchy,
      })
      .from(agentHierarchy)
      .innerJoin(agents, eq(agentHierarchy.agentCode, agents.agentCode))
      .where(and(
        eq(agentHierarchy.leaderCode, this.input.leaderCode),
        this.input.scope === 'direct'
          ? eq(agentHierarchy.hierarchy, 1)
          : gt(agentHierarchy.hierarchy, 0),
      ))
      .orderBy(
        asc(agentHierarchy.hierarchy),
        asc(agents.name),
        asc(agentHierarchy.agentCode),
      )

    return rows
      .filter((row): row is typeof row & { agentCode: string } => !!row.agentCode)
      .map((row) => ({
        agentCode: row.agentCode,
        name: row.name,
        designation: row.designation,
        leaderCode: row.leaderCode,
        hierarchy: row.hierarchy,
      }))
  }
}
