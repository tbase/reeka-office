import type { AppendAgentLogInput } from '@reeka-office/domain-agent'

import type { AgentDirectoryPort, DomainEventStore, TeamHierarchyPort } from '../domain/ports'
import type { ApmRepository, PerformanceReadRepository } from '../domain/repositories'

export interface PerformanceAgentLogPort {
  append(logs: AppendAgentLogInput[]): Promise<void>
}

export interface PerformanceRuntime {
  apmRepository: ApmRepository
  performanceReadRepository: PerformanceReadRepository
  agentDirectoryPort: AgentDirectoryPort
  teamHierarchyPort: TeamHierarchyPort
  domainEventStore: DomainEventStore
  agentLogStore: PerformanceAgentLogPort
}

export interface PerformanceApplicationDependencies {
  executeInTransaction<T>(work: (runtime: PerformanceRuntime) => Promise<T>): Promise<T>
  now(): Date
}
