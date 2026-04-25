import type { PerformanceAgentLogPort, PerformanceRuntime } from '../application/runtime'
import type { DBExecutor } from '../context'
import { getDb } from '../context'
import { DrizzleAgentDirectoryPort } from './drizzleAgentDirectoryPort'
import { DrizzleApmRepository } from './drizzleApmRepository'
import { DrizzleDomainEventStore } from './drizzleDomainEventStore'
import { DrizzlePerformanceReadRepository } from './drizzlePerformanceReadRepository'
import { DrizzleTeamHierarchyPort } from './drizzleTeamHierarchyPort'

export interface PerformanceReaderRuntime {
  performanceReadRepository: DrizzlePerformanceReadRepository
  agentDirectoryPort: DrizzleAgentDirectoryPort
  teamHierarchyPort: DrizzleTeamHierarchyPort
}

export function createPerformanceRuntime(
  db: DBExecutor,
  dependencies: {
    agentLogStore: PerformanceAgentLogPort
  },
): PerformanceRuntime {
  return {
    apmRepository: new DrizzleApmRepository(db),
    performanceReadRepository: new DrizzlePerformanceReadRepository(db),
    agentDirectoryPort: new DrizzleAgentDirectoryPort(db),
    teamHierarchyPort: new DrizzleTeamHierarchyPort(db),
    domainEventStore: new DrizzleDomainEventStore(db),
    agentLogStore: dependencies.agentLogStore,
  }
}

export function createDefaultPerformanceRuntime(dependencies: {
  agentLogStore: PerformanceAgentLogPort
}): PerformanceRuntime {
  return createPerformanceRuntime(getDb(), dependencies)
}

export function createPerformanceReaderRuntime(db: DBExecutor = getDb()): PerformanceReaderRuntime {
  return {
    performanceReadRepository: new DrizzlePerformanceReadRepository(db),
    agentDirectoryPort: new DrizzleAgentDirectoryPort(db),
    teamHierarchyPort: new DrizzleTeamHierarchyPort(db),
  }
}
