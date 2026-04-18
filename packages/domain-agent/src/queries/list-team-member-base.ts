import { and, asc, eq, gt, isNull, ne } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { agentHierarchy, agents } from '../db/schema'

export type TeamScope = 'direct' | 'division' | 'all'

export interface TeamMemberBaseItem {
  agentCode: string
  name: string
  designation: number | null
  leaderCode: string | null
  hierarchy: number
}

interface ListHierarchyTeamMemberBaseInput {
  leaderCode: string
  scope: 'direct' | 'all'
}

interface ListDivisionTeamMemberBaseInput {
  agentCode: string
  division: string
  scope: 'division'
}

export type ListTeamMemberBaseInput =
  | ListHierarchyTeamMemberBaseInput
  | ListDivisionTeamMemberBaseInput

export type ListTeamMemberBaseResult = TeamMemberBaseItem[]

export class ListTeamMemberBaseQuery {
  private readonly db: DB
  private readonly input: ListTeamMemberBaseInput

  constructor(input: ListTeamMemberBaseInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ListTeamMemberBaseResult> {
    if (this.input.scope === 'division') {
      const rows = await this.db
        .select({
          agentCode: agents.agentCode,
          name: agents.name,
          designation: agents.designation,
          leaderCode: agents.leaderCode,
        })
        .from(agents)
        .where(and(
          eq(agents.division, this.input.division),
          isNull(agents.deletedAt),
          ne(agents.agentCode, this.input.agentCode),
        ))
        .orderBy(
          asc(agents.name),
          asc(agents.agentCode),
        )

      return rows
        .filter((row): row is typeof row & { agentCode: string } => !!row.agentCode)
        .map((row) => ({
          agentCode: row.agentCode,
          name: row.name,
          designation: row.designation,
          leaderCode: row.leaderCode,
          hierarchy: 2,
        }))
    }

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
        isNull(agents.deletedAt),
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
