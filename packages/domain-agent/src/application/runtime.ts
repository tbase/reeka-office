import type { AppendAgentLogInput } from '../agent-log'
import type { AgentRuntime } from '../domain/repositories'

export interface AgentLogStore {
  append(logs: AppendAgentLogInput[]): Promise<void>
}

export interface AgentApplicationRuntime extends AgentRuntime {
  agentLogStore: AgentLogStore
}

export interface AgentApplicationDependencies {
  executeInTransaction<T>(work: (runtime: AgentApplicationRuntime) => Promise<T>): Promise<T>
  now(): Date
}
