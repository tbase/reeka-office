import { desc, inArray } from 'drizzle-orm'

import type {
  AgentLogAction,
  AgentLogCategory,
  AgentLogChange,
  AgentLogSource,
} from '../agent-log'
import { getDb, type DB } from '../context'
import { agentLogs } from '../db/schema'

export interface AgentLogItem {
  id: number
  agentCode: string
  category: AgentLogCategory
  action: AgentLogAction
  periodYear: number | null
  periodMonth: number | null
  source: AgentLogSource
  changes: AgentLogChange[]
  createdAt: Date | string
}

export interface ListAgentLogsInput {
  agentCodes: string[]
}

export type ListAgentLogsResult = AgentLogItem[]

export class ListAgentLogsQuery {
  private readonly db: DB
  private readonly input: ListAgentLogsInput

  constructor(input: ListAgentLogsInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ListAgentLogsResult> {
    const agentCodes = [...new Set(
      this.input.agentCodes
        .map((agentCode) => agentCode.trim())
        .filter((agentCode) => agentCode.length > 0),
    )]

    if (agentCodes.length === 0) {
      return []
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
      .where(inArray(agentLogs.agentCode, agentCodes))
      .orderBy(desc(agentLogs.createdAt), desc(agentLogs.id))

    return rows.map((row) => ({
      ...row,
      category: row.category as AgentLogCategory,
      action: row.action as AgentLogAction,
      source: row.source as AgentLogSource,
    }))
  }
}
