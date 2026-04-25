import type { Agent, AgentSnapshot } from './agent'
import type { AgentDomainEvent } from './events'
import type { AgentHierarchyEntry, AgentHierarchySource } from './teamHierarchy'

export interface AgentRepository {
  findByCodes(agentCodes: string[]): Promise<Agent[]>
  findActiveByCode(agentCode: string): Promise<Agent | null>
  listActiveAgentCodes(): Promise<string[]>
  save(agent: Agent): Promise<void>
}

export interface TeamHierarchyRepository {
  listSources(): Promise<AgentHierarchySource[]>
  replace(rows: AgentHierarchyEntry[]): Promise<void>
}

export interface AgentDomainEventStore {
  append(events: AgentDomainEvent[]): Promise<void>
}

export interface AgentRuntime {
  agentRepository: AgentRepository
  teamHierarchyRepository: TeamHierarchyRepository
  domainEventStore: AgentDomainEventStore
}

export type { AgentSnapshot }
