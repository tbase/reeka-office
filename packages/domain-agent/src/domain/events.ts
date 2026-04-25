export type AgentEventValue = string | number | boolean | string[] | null

export interface AgentProfileChange {
  field: string
  before: AgentEventValue
  after: AgentEventValue
}

export interface AgentCreated {
  type: 'AgentCreated'
  agentCode: string
  changes: AgentProfileChange[]
  occurredAt: Date
}

export interface AgentProfileUpdated {
  type: 'AgentProfileUpdated'
  agentCode: string
  changes: AgentProfileChange[]
  occurredAt: Date
}

export interface AgentLeaderChanged {
  type: 'AgentLeaderChanged'
  agentCode: string
  before: string | null
  after: string | null
  occurredAt: Date
}

export interface AgentPromotionDateChanged {
  type: 'AgentPromotionDateChanged'
  agentCode: string
  before: string | null
  after: string | null
  occurredAt: Date
}

export interface AgentRestored {
  type: 'AgentRestored'
  agentCode: string
  occurredAt: Date
}

export interface AgentDeleted {
  type: 'AgentDeleted'
  agentCode: string
  occurredAt: Date
}

export type AgentDomainEvent =
  | AgentCreated
  | AgentProfileUpdated
  | AgentLeaderChanged
  | AgentPromotionDateChanged
  | AgentRestored
  | AgentDeleted

export type AgentDomainEventPayload = Record<string, unknown>
