import type { AgentApplicationRuntime } from '../application/runtime'
import { getDb, withTransaction, type DBExecutor } from '../context'
import { DrizzleAgentDomainEventStore } from './drizzleAgentDomainEventStore'
import { DrizzleAgentLogStore } from './drizzleAgentLogStore'
import { DrizzleAgentRepository } from './drizzleAgentRepository'
import { DrizzleTeamHierarchyRepository } from './drizzleTeamHierarchyRepository'

export function createAgentRuntime(db: DBExecutor): AgentApplicationRuntime {
  return {
    agentRepository: new DrizzleAgentRepository(db),
    teamHierarchyRepository: new DrizzleTeamHierarchyRepository(db),
    domainEventStore: new DrizzleAgentDomainEventStore(db),
    agentLogStore: new DrizzleAgentLogStore(db),
  }
}

export function createDefaultAgentRuntime(): AgentApplicationRuntime {
  return createAgentRuntime(getDb())
}

export function executeWithAgentRuntime<T>(
  work: (runtime: AgentApplicationRuntime) => Promise<T>,
): Promise<T> {
  return withTransaction((tx) => work(createAgentRuntime(tx)))
}
