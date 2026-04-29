import { and, asc, desc, eq, gt, isNull, like, ne, or, sql } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import { agentHierarchy, agentLogs, agents } from '../schema'
import type {
  AgentLogAction,
  AgentLogCategory,
  AgentLogSource,
} from '../agent-log'
import type { AgentRecord } from '../domain/readModels'

export class DrizzleAgentReadRepository {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async getAgent(agentId: number): Promise<AgentRecord | null> {
    const rows = await this.db
      .select(agentSelection)
      .from(agents)
      .where(and(
        eq(agents.id, agentId),
        isNull(agents.deletedAt),
      ))
      .limit(1)

    return rows[0] ?? null
  }

  async getAgentByCode(agentCode: string) {
    const rows = await this.db
      .select({
        id: agents.id,
        agentCode: agents.agentCode,
        name: agents.name,
        joinDate: agents.joinDate,
        designation: agents.designation,
        leaderCode: agents.leaderCode,
        division: agents.division,
      })
      .from(agents)
      .where(and(
        eq(agents.agentCode, agentCode),
        isNull(agents.deletedAt),
      ))
      .limit(1)

    const row = rows[0]
    return row?.agentCode ? {
      id: row.id,
      agentCode: row.agentCode,
      name: row.name,
      joinDate: row.joinDate,
      designation: row.designation,
      leaderCode: row.leaderCode,
      division: row.division,
    } : null
  }

  async getPromotionProfile(agentCode: string) {
    const rows = await this.db
      .select({
        agentCode: agents.agentCode,
        designation: agents.designation,
        joinDate: agents.joinDate,
        lastPromotionDate: agents.lastPromotionDate,
      })
      .from(agents)
      .where(and(
        eq(agents.agentCode, agentCode),
        isNull(agents.deletedAt),
      ))
      .limit(1)

    const row = rows[0]
    return row?.agentCode ? {
      agentCode: row.agentCode,
      designation: row.designation,
      joinDate: row.joinDate,
      lastPromotionDate: row.lastPromotionDate,
    } : null
  }

  async getTeamMemberRelation(input: { leaderCode: string; agentCode: string }) {
    const rows = await this.db
      .select({
        hierarchy: agentHierarchy.hierarchy,
      })
      .from(agentHierarchy)
      .where(and(
        eq(agentHierarchy.leaderCode, input.leaderCode),
        eq(agentHierarchy.agentCode, input.agentCode),
      ))
      .limit(1)

    const row = rows[0]
    return row ? { hierarchy: row.hierarchy } : null
  }

  async listAgencies(): Promise<string[]> {
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

  async listAgents(input: {
    agency?: string | null
    division?: string | null
    sort?: 'designation_asc' | 'designation_desc' | 'join_date_asc' | 'join_date_desc'
    agentId?: number
    keyword?: string | null
    limit?: number
  }): Promise<AgentRecord[]> {
    const conditions = [isNull(agents.deletedAt)]
    const agency = input.agency?.trim()
    const division = input.division?.trim()
    const keyword = input.keyword?.trim()

    if (agency) {
      conditions.push(eq(agents.agency, agency))
    }

    if (division) {
      conditions.push(eq(agents.division, division))
    }

    if (input.agentId) {
      conditions.push(eq(agents.id, input.agentId))
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

    const query = this.db
      .select(agentSelection)
      .from(agents)
      .where(and(...conditions))
      .orderBy(...buildAgentOrderBy(input.sort))

    return typeof input.limit === 'number' ? query.limit(input.limit) : query
  }

  async listTeamMemberBase(input:
    | { leaderCode: string; scope: 'direct' | 'all' }
    | { agentCode: string; division: string; scope: 'division' }
  ) {
    if (input.scope === 'division') {
      const rows = await this.db
        .select({
          agentCode: agents.agentCode,
          name: agents.name,
          designation: agents.designation,
          leaderCode: agents.leaderCode,
        })
        .from(agents)
        .where(and(
          eq(agents.division, input.division),
          isNull(agents.deletedAt),
          ne(agents.agentCode, input.agentCode),
        ))
        .orderBy(
          asc(agents.name),
          asc(agents.agentCode),
        )

      return rows
        .filter((row): row is typeof row & { agentCode: string } => row.agentCode != null)
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
        eq(agentHierarchy.leaderCode, input.leaderCode),
        isNull(agents.deletedAt),
        input.scope === 'direct'
          ? eq(agentHierarchy.hierarchy, 1)
          : gt(agentHierarchy.hierarchy, 0),
      ))
      .orderBy(
        asc(agentHierarchy.hierarchy),
        asc(agents.name),
        asc(agentHierarchy.agentCode),
      )

    return rows
      .filter((row): row is typeof row & { agentCode: string } => row.agentCode != null)
      .map((row) => ({
        agentCode: row.agentCode,
        name: row.name,
        designation: row.designation,
        leaderCode: row.leaderCode,
        hierarchy: row.hierarchy,
      }))
  }

  async listLogs(input: {
    agentCode: string
    category?: AgentLogCategory
    month?: string
    limit?: number
  }) {
    const conditions = [eq(agentLogs.agentCode, input.agentCode)]

    if (input.category) {
      conditions.push(eq(agentLogs.category, input.category))
    }

    const monthRange = getMonthRange(input.month)
    if (monthRange) {
      conditions.push(sql`${agentLogs.createdAt} >= ${`${monthRange.start} 00:00:00`}`)
      conditions.push(sql`${agentLogs.createdAt} < ${`${monthRange.end} 00:00:00`}`)
    }

    const rows = await this.db
      .select({
        id: agentLogs.id,
        agentCode: agentLogs.agentCode,
        category: agentLogs.category,
        action: agentLogs.action,
        periodYear: agentLogs.periodYear,
        periodMonth: agentLogs.periodMonth,
        source: agentLogs.source,
        changes: agentLogs.changes,
        createdAt: agentLogs.createdAt,
      })
      .from(agentLogs)
      .where(and(...conditions))
      .orderBy(desc(agentLogs.createdAt), desc(agentLogs.id))
      .limit(input.limit ?? 50)

    return rows.map((row) => ({
      ...row,
      category: row.category as AgentLogCategory,
      action: row.action as AgentLogAction,
      source: row.source as AgentLogSource,
    }))
  }
}

const agentSelection = {
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
}

function buildAgentOrderBy(sort: 'designation_asc' | 'designation_desc' | 'join_date_asc' | 'join_date_desc' | undefined) {
  if (sort === 'designation_asc') {
    return [
      sql`case when ${agents.designation} is null then 1 else 0 end`,
      asc(agents.designation),
      asc(agents.id),
    ]
  }

  if (sort === 'designation_desc') {
    return [
      sql`case when ${agents.designation} is null then 1 else 0 end`,
      desc(agents.designation),
      asc(agents.id),
    ]
  }

  if (sort === 'join_date_asc') {
    return [
      sql`case when ${agents.joinDate} is null then 1 else 0 end`,
      asc(agents.joinDate),
      asc(agents.id),
    ]
  }

  if (sort === 'join_date_desc') {
    return [
      sql`case when ${agents.joinDate} is null then 1 else 0 end`,
      desc(agents.joinDate),
      asc(agents.id),
    ]
  }

  return [asc(agents.id)]
}

function getMonthRange(month: string | undefined) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return null
  }

  const [yearText, monthText] = month.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText)

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 1 || monthIndex > 12) {
    return null
  }

  const start = `${yearText}-${monthText}-01`
  const endYear = monthIndex === 12 ? year + 1 : year
  const endMonth = monthIndex === 12 ? 1 : monthIndex + 1

  return {
    start,
    end: `${String(endYear)}-${String(endMonth).padStart(2, '0')}-01`,
  }
}
