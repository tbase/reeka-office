import { and, eq, inArray, isNull } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import { Agent, type AgentSnapshot } from '../domain/agent'
import type { AgentRepository } from '../domain/repositories'
import { agents, type NewAgentRow } from '../schema'

export class DrizzleAgentRepository implements AgentRepository {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async findByCodes(agentCodes: string[]): Promise<Agent[]> {
    if (agentCodes.length === 0) {
      return []
    }

    const rows = await this.db
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
        deletedAt: agents.deletedAt,
      })
      .from(agents)
      .where(inArray(agents.agentCode, agentCodes))

    return rows
      .filter((row): row is typeof row & { agentCode: string } => row.agentCode != null)
      .map((row) => Agent.restore(toSnapshot(row)))
  }

  async findActiveByCode(agentCode: string): Promise<Agent | null> {
    const rows = await this.db
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
        deletedAt: agents.deletedAt,
      })
      .from(agents)
      .where(and(
        eq(agents.agentCode, agentCode),
        isNull(agents.deletedAt),
      ))
      .limit(1)

    const row = rows[0]
    return row?.agentCode ? Agent.restore(toSnapshot(row as typeof row & { agentCode: string })) : null
  }

  async listActiveAgentCodes(): Promise<string[]> {
    const rows = await this.db
      .select({
        agentCode: agents.agentCode,
      })
      .from(agents)
      .where(isNull(agents.deletedAt))

    return rows
      .map((row) => row.agentCode)
      .filter((agentCode): agentCode is string => agentCode != null)
  }

  async save(agent: Agent): Promise<void> {
    const snapshot = agent.toSnapshot()
    const values = toValues(snapshot)

    if (snapshot.id == null) {
      const result = await this.db.insert(agents).values(values).$returningId()
      const id = result[0]?.id
      if (id != null) {
        agent.assignId(id)
      }
      return
    }

    await this.db
      .update(agents)
      .set(values)
      .where(eq(agents.id, snapshot.id))
  }
}

function toSnapshot(row: Omit<AgentSnapshot, 'agentCode'> & { agentCode: string }): AgentSnapshot {
  return {
    id: row.id,
    agentCode: row.agentCode,
    name: row.name,
    joinDate: row.joinDate,
    designation: row.designation,
    finacingScheme: row.finacingScheme,
    leaderCode: row.leaderCode,
    lastPromotionDate: row.lastPromotionDate,
    agency: row.agency,
    division: row.division,
    branch: row.branch,
    unit: row.unit,
    deletedAt: row.deletedAt,
  }
}

function toValues(snapshot: AgentSnapshot): NewAgentRow {
  return {
    agentCode: snapshot.agentCode,
    name: snapshot.name,
    joinDate: snapshot.joinDate,
    designation: snapshot.designation,
    finacingScheme: snapshot.finacingScheme,
    leaderCode: snapshot.leaderCode,
    lastPromotionDate: snapshot.lastPromotionDate,
    agency: snapshot.agency,
    division: snapshot.division,
    branch: snapshot.branch,
    unit: snapshot.unit,
    deletedAt: toDate(snapshot.deletedAt),
  }
}

function toDate(value: string | Date | null): Date | null {
  if (value == null || value instanceof Date) {
    return value
  }

  return new Date(value)
}
