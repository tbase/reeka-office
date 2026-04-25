import type { AppendAgentLogInput } from '../agent-log'
import type { AgentApplicationDependencies } from '../application/runtime'
import { Agent } from '../domain/agent'
import type { AgentDomainEvent } from '../domain/events'
import {
  normalizeAgentProfile,
  type AgentProfileInput,
  type AgentProfileState,
} from '../domain/profile'
import { buildAgentHierarchy } from '../domain/teamHierarchy'

export type ImportedAgentInput = AgentProfileInput

export interface ImportAgentsInput {
  agents: ImportedAgentInput[]
}

export interface ImportAgentsResult {
  importedCount: number
  createdCount: number
  updatedCount: number
  deletedCount: number
}

export class ImportAgentsCommand {
  private readonly input: ImportAgentsInput
  private readonly dependencies: AgentApplicationDependencies

  constructor(
    input: ImportAgentsInput,
    dependencies: AgentApplicationDependencies,
  ) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<ImportAgentsResult> {
    const dedupedAgents = new Map<string, AgentProfileState>()

    for (const item of this.input.agents) {
      const normalized = normalizeAgentProfile(item)
      dedupedAgents.set(normalized.agentCode, normalized)
    }

    if (dedupedAgents.size === 0) {
      throw new Error('没有可导入的代理人数据')
    }

    const now = this.dependencies.now()

    return this.dependencies.executeInTransaction(async (runtime) => {
      const importedAgents = sortAgentsByLeader([...dedupedAgents.values()])
      const importedCodes = importedAgents.map((agent) => agent.agentCode)
      const importedCodeSet = new Set(importedCodes)
      const missingLeaderCodes = [...new Set(
        importedAgents
          .map((agent) => agent.leaderCode)
          .filter((code): code is string => !!code && !importedCodeSet.has(code)),
      )]

      if (missingLeaderCodes.length > 0) {
        throw new Error(`直属上级不存在: ${missingLeaderCodes.join(', ')}`)
      }

      const [existingAgents, activeAgentCodes] = await Promise.all([
        runtime.agentRepository.findByCodes(importedCodes),
        runtime.agentRepository.listActiveAgentCodes(),
      ])
      const existingByCode = new Map(existingAgents.map((agent) => [agent.agentCode, agent]))
      const updatedAgentCodes = new Set<string>()
      const events: AgentDomainEvent[] = []

      let createdCount = 0

      for (const profile of importedAgents) {
        const existing = existingByCode.get(profile.agentCode)

        if (!existing) {
          const agent = Agent.create(profile, now)
          await runtime.agentRepository.save(agent)
          events.push(...agent.pullDomainEvents())
          createdCount += 1
          existingByCode.set(agent.agentCode, agent)
          continue
        }

        const restored = existing.restoreDeleted(now)
        const changes = existing.updateProfile(profile, now)

        if (restored || changes.length > 0) {
          await runtime.agentRepository.save(existing)
          events.push(...existing.pullDomainEvents())
        }

        if (changes.length > 0) {
          updatedAgentCodes.add(existing.agentCode)
        }
      }

      const deletedAgentCodes = activeAgentCodes.filter((code) => !importedCodeSet.has(code))
      const deletedAgents = await runtime.agentRepository.findByCodes(deletedAgentCodes)
      for (const agent of deletedAgents) {
        if (agent.delete(now)) {
          await runtime.agentRepository.save(agent)
          events.push(...agent.pullDomainEvents())
        }
      }

      const hierarchyRows = buildAgentHierarchy(await runtime.teamHierarchyRepository.listSources())
      await runtime.teamHierarchyRepository.replace(hierarchyRows)
      await runtime.domainEventStore.append(events)
      await runtime.agentLogStore.append(toImportAgentLogs(events))

      return {
        importedCount: dedupedAgents.size,
        createdCount,
        updatedCount: updatedAgentCodes.size,
        deletedCount: deletedAgents.length,
      }
    })
  }
}

function sortAgentsByLeader(agents: AgentProfileState[]): AgentProfileState[] {
  const byCode = new Map(agents.map((agent) => [agent.agentCode, agent]))
  const sorted: AgentProfileState[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  const visit = (agent: AgentProfileState) => {
    if (visited.has(agent.agentCode)) {
      return
    }

    if (visiting.has(agent.agentCode)) {
      throw new Error(`代理人层级存在循环: ${[...visiting, agent.agentCode].join(' -> ')}`)
    }

    visiting.add(agent.agentCode)

    const leader = agent.leaderCode ? byCode.get(agent.leaderCode) : null
    if (leader) {
      visit(leader)
    }

    visiting.delete(agent.agentCode)
    visited.add(agent.agentCode)
    sorted.push(agent)
  }

  for (const agent of agents) {
    visit(agent)
  }

  return sorted
}

function toImportAgentLogs(events: AgentDomainEvent[]): AppendAgentLogInput[] {
  const logs: AppendAgentLogInput[] = []

  for (const event of events) {
    if (event.type === 'AgentCreated') {
      logs.push({
        agentCode: event.agentCode,
        category: 'profile',
        action: 'created',
        source: 'ImportAgentsCommand',
        changes: event.changes,
      })
      continue
    }

    if (event.type === 'AgentProfileUpdated') {
      logs.push({
        agentCode: event.agentCode,
        category: 'profile',
        action: 'updated',
        source: 'ImportAgentsCommand',
        changes: event.changes,
      })
      continue
    }

    if (event.type === 'AgentRestored') {
      logs.push({
        agentCode: event.agentCode,
        category: 'profile',
        action: 'restored',
        source: 'ImportAgentsCommand',
        changes: [],
      })
      continue
    }

    if (event.type === 'AgentDeleted') {
      logs.push({
        agentCode: event.agentCode,
        category: 'profile',
        action: 'deleted',
        source: 'ImportAgentsCommand',
        changes: [],
      })
    }
  }

  return logs
}
