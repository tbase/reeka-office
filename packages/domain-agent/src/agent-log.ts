import { agentLogs } from './db/schema'
import type { DBExecutor } from './context'

export type AgentLogCategory = 'profile' | 'apm'
export type AgentLogAction = 'created' | 'updated' | 'deleted' | 'restored'
export type AgentLogSource =
  | 'ImportAgentsCommand'
  | 'UpdateAgentLastPromotionDateCommand'
  | 'ImportApmCommand'
  | 'RecalculateApmQualificationCommand'

export type AgentLogValue = string | number | boolean | string[] | null

export interface AgentLogChange {
  field: string
  before: AgentLogValue
  after: AgentLogValue
}

export interface AppendAgentLogInput {
  agentCode: string
  category: AgentLogCategory
  action: AgentLogAction
  periodYear?: number | null
  periodMonth?: number | null
  source: AgentLogSource
  changes: AgentLogChange[]
}

export async function appendAgentLogs(
  db: DBExecutor,
  logs: AppendAgentLogInput[],
): Promise<void> {
  if (logs.length === 0) {
    return
  }

  await db.insert(agentLogs).values(logs.map((log) => ({
    agentCode: log.agentCode,
    category: log.category,
    action: log.action,
    periodYear: log.periodYear ?? null,
    periodMonth: log.periodMonth ?? null,
    source: log.source,
    changes: log.changes,
  })))
}
