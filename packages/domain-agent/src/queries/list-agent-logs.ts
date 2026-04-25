import type {
  AgentLogAction,
  AgentLogCategory,
  AgentLogChange,
  AgentLogSource,
} from '../agent-log'
import { getDb } from '../context'
import { DrizzleAgentReadRepository } from '../infra'

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
  agentCode: string
  category?: AgentLogCategory
  month?: string
  limit?: number
}

export type ListAgentLogsResult = AgentLogItem[]

export class ListAgentLogsQuery {
  private readonly repository: DrizzleAgentReadRepository
  private readonly input: ListAgentLogsInput

  constructor(input: ListAgentLogsInput) {
    this.repository = new DrizzleAgentReadRepository(getDb())
    this.input = input
  }

  async query(): Promise<ListAgentLogsResult> {
    const agentCode = this.input.agentCode.trim()
    if (agentCode.length === 0) {
      return []
    }

    const limit = typeof this.input.limit === 'number' && this.input.limit > 0
      ? Math.floor(this.input.limit)
      : 50

    return this.repository.listLogs({
      agentCode,
      category: this.input.category,
      month: this.input.month,
      limit,
    })
  }
}
