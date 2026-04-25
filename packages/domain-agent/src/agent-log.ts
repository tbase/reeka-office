import type { AgentEventValue, AgentProfileChange } from './domain/events'

export type AgentLogCategory = 'profile' | 'apm'
export type AgentLogAction = 'created' | 'updated' | 'deleted' | 'restored'
export type AgentLogSource = string

export type AgentLogValue = AgentEventValue
export type AgentLogChange = AgentProfileChange

export interface AppendAgentLogInput {
  agentCode: string
  category: AgentLogCategory
  action: AgentLogAction
  periodYear?: number | null
  periodMonth?: number | null
  source: AgentLogSource
  changes: AgentLogChange[]
}
