import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agents } from '../db/schema'
import type { Agent } from '../types'

export const LIST_AGENT_SORTS = [
  'designation_asc',
  'designation_desc',
  'join_date_asc',
  'join_date_desc',
] as const

export type ListAgentSort = (typeof LIST_AGENT_SORTS)[number]

export interface ListAgentsInput {
  agency?: string | null
  sort?: ListAgentSort
  agentId?: number
  keyword?: string | null
  limit?: number
}

export type ListAgentsResult = Agent[]

export class ListAgentsQuery {
  private readonly db: DB
  private readonly input: ListAgentsInput

  constructor(input: ListAgentsInput) {
    this.input = input
    this.db = getDb()
  }

  async query(): Promise<ListAgentsResult> {
    const conditions = []
    const agency = this.input.agency?.trim()
    const keyword = this.input.keyword?.trim()

    if (agency) {
      conditions.push(eq(agents.agency, agency))
    }

    if (this.input.agentId) {
      conditions.push(eq(agents.id, this.input.agentId))
    }

    if (keyword) {
      const pattern = `%${keyword}%`
      conditions.push(
        or(
          like(agents.agentCode, pattern),
          like(agents.name, pattern),
          like(agents.leaderCode, pattern),
        )!,
      )
    }

    const sort = this.input.sort ?? null

    const query = this.db
      .select({
        id: agents.id,
        agentCode: agents.agentCode,
        name: agents.name,
        joinDate: agents.joinDate,
        designation: agents.designation,
        finacingScheme: agents.finacingScheme,
        leaderCode: agents.leaderCode,
        lastPromotionDate: agents.lastPromotionDate,
        agency: agents.agency,
        division: agents.division,
        branch: agents.branch,
        unit: agents.unit,
      })
      .from(agents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        ...(sort === 'designation_asc'
          ? [
              sql`case when ${agents.designation} is null then 1 else 0 end`,
              asc(agents.designation),
              asc(agents.id),
            ]
          : sort === 'designation_desc'
            ? [
                sql`case when ${agents.designation} is null then 1 else 0 end`,
                desc(agents.designation),
                asc(agents.id),
              ]
            : sort === 'join_date_asc'
              ? [
                  sql`case when ${agents.joinDate} is null then 1 else 0 end`,
                  asc(agents.joinDate),
                  asc(agents.id),
                ]
              : sort === 'join_date_desc'
                ? [
                    sql`case when ${agents.joinDate} is null then 1 else 0 end`,
                    desc(agents.joinDate),
                    asc(agents.id),
                  ]
                : [asc(agents.id)]),
      )

    const rows = await (typeof this.input.limit === 'number'
      ? query.limit(this.input.limit)
      : query)

    return rows
  }
}
