import {
  appendAgentLogs,
  type AgentDBExecutor,
  type AppendAgentLogInput,
} from '@reeka-office/domain-agent'
import type { DBExecutor } from '../context'
import { getDb } from '../context'
import type { AgentDirectoryPort, DomainEventStore, TeamHierarchyPort } from '../domain/ports'
import type { ApmRepository, PerformanceReadRepository } from '../domain/repositories'
import { DrizzleAgentDirectoryPort } from './drizzleAgentDirectoryPort'
import { DrizzleApmRepository } from './drizzleApmRepository'
import { DrizzleDomainEventStore } from './drizzleDomainEventStore'
import { DrizzlePerformanceReadRepository } from './drizzlePerformanceReadRepository'
import { DrizzleTeamHierarchyPort } from './drizzleTeamHierarchyPort'

export interface PerformanceRuntime {
  apmRepository: ApmRepository
  performanceReadRepository: PerformanceReadRepository
  agentDirectoryPort: AgentDirectoryPort
  teamHierarchyPort: TeamHierarchyPort
  domainEventStore: DomainEventStore
  appendAgentLogs(logs: AppendAgentLogInput[]): Promise<void>
}

export function createPerformanceRuntime(db: DBExecutor): PerformanceRuntime {
  return {
    apmRepository: new DrizzleApmRepository(db),
    performanceReadRepository: new DrizzlePerformanceReadRepository(db),
    agentDirectoryPort: new DrizzleAgentDirectoryPort(db),
    teamHierarchyPort: new DrizzleTeamHierarchyPort(db),
    domainEventStore: new DrizzleDomainEventStore(db),
    appendAgentLogs: (logs) => appendAgentLogs(db as unknown as AgentDBExecutor, logs),
  }
}

export function createDefaultPerformanceRuntime(): PerformanceRuntime {
  return createPerformanceRuntime(getDb())
}
