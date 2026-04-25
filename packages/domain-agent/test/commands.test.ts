import { describe, expect, it } from 'vitest'

import {
  Agent,
  ImportAgentsCommand,
  UpdateAgentLastPromotionDateCommand,
  buildAgentHierarchy,
  normalizeAgentProfile,
  type AgentApplicationRuntime,
  type AgentDomainEvent,
  type AgentSnapshot,
  type AppendAgentLogInput,
  type ImportedAgentInput,
} from '../src'

function createAgent(overrides: Partial<AgentSnapshot> = {}): AgentSnapshot {
  return {
    id: 1,
    agentCode: 'A001',
    name: 'Alice',
    joinDate: '2026-01-01',
    designation: 1,
    finacingScheme: ['FYC'],
    leaderCode: null,
    lastPromotionDate: '2026-03-01',
    agency: 'Agency A',
    division: 'Division A',
    branch: 'Branch A',
    unit: 'Unit A',
    deletedAt: null,
    ...overrides,
  }
}

function toImportedAgent(agent: AgentSnapshot): ImportedAgentInput {
  return {
    agentCode: agent.agentCode,
    name: agent.name,
    joinDate: agent.joinDate,
    designation: agent.designation,
    finacingScheme: agent.finacingScheme,
    leaderCode: agent.leaderCode,
    lastPromotionDate: agent.lastPromotionDate,
    agency: agent.agency,
    division: agent.division,
    branch: agent.branch,
    unit: agent.unit,
  }
}

class MemoryAgentRuntime {
  readonly logs: AppendAgentLogInput[] = []
  readonly events: AgentDomainEvent[] = []
  hierarchy: Array<{ agentCode: string; leaderCode: string; hierarchy: number }> = []
  private readonly records = new Map<string, AgentSnapshot>()
  private nextId = 1

  readonly runtime: AgentApplicationRuntime = {
    agentRepository: {
      findByCodes: (agentCodes) => this.findByCodes(agentCodes),
      findActiveByCode: (agentCode) => this.findActiveByCode(agentCode),
      listActiveAgentCodes: () => this.listActiveAgentCodes(),
      save: (agent) => this.save(agent),
    },
    teamHierarchyRepository: {
      listSources: () => this.listHierarchySourceRows(),
      replace: (rows) => this.replaceHierarchy(rows),
    },
    domainEventStore: {
      append: (events) => this.appendEvents(events),
    },
    agentLogStore: {
      append: (logs) => this.appendLogs(logs),
    },
  }

  constructor(records: AgentSnapshot[] = []) {
    for (const record of records) {
      this.records.set(record.agentCode, cloneRecord(record))
      this.nextId = Math.max(this.nextId, (record.id ?? 0) + 1)
    }
  }

  getRecord(agentCode: string) {
    const record = this.records.get(agentCode)
    return record ? cloneRecord(record) : null
  }

  private async findByCodes(agentCodes: string[]) {
    return agentCodes
      .map((agentCode) => this.records.get(agentCode))
      .filter((record): record is AgentSnapshot => record != null)
      .map((record) => Agent.restore(cloneRecord(record)))
  }

  private async findActiveByCode(agentCode: string) {
    const record = this.records.get(agentCode)
    return record && record.deletedAt === null ? Agent.restore(cloneRecord(record)) : null
  }

  private async listActiveAgentCodes() {
    return [...this.records.values()]
      .filter((record) => record.deletedAt === null)
      .map((record) => record.agentCode)
  }

  private async save(agent: Agent) {
    const snapshot = agent.toSnapshot()
    const id = snapshot.id ?? this.nextId
    if (snapshot.id == null) {
      agent.assignId(id)
      this.nextId += 1
    }

    this.records.set(snapshot.agentCode, {
      ...snapshot,
      id,
    })
  }

  private async listHierarchySourceRows() {
    return [...this.records.values()]
      .filter((record) => record.deletedAt === null)
      .map((record) => ({
        agentCode: record.agentCode,
        leaderCode: record.leaderCode,
        designation: record.designation,
      }))
  }

  private async replaceHierarchy(rows: Array<{ agentCode: string; leaderCode: string; hierarchy: number }>) {
    this.hierarchy = rows.map((row) => ({ ...row }))
  }

  private async appendEvents(events: AgentDomainEvent[]) {
    this.events.push(...events)
  }

  private async appendLogs(logs: AppendAgentLogInput[]) {
    this.logs.push(...logs.map((log) => ({
      ...log,
      changes: log.changes.map((change) => ({
        ...change,
        before: Array.isArray(change.before) ? [...change.before] : change.before,
        after: Array.isArray(change.after) ? [...change.after] : change.after,
      })),
    })))
  }

}

function cloneRecord(record: AgentSnapshot): AgentSnapshot {
  return {
    ...record,
    finacingScheme: record.finacingScheme ? [...record.finacingScheme] : null,
  }
}

function executeWith(runtime: MemoryAgentRuntime) {
  return {
    executeInTransaction: async <T>(work: (runtime: AgentApplicationRuntime) => Promise<T>) =>
      work(runtime.runtime),
    now: () => new Date('2026-04-01T00:00:00.000Z'),
  }
}

describe('Agent profile domain', () => {
  it('normalizes and validates imported profiles', () => {
    expect(normalizeAgentProfile({
      agentCode: ' A001 ',
      name: ' Alice ',
      joinDate: '',
    })).toMatchObject({
      agentCode: 'A001',
      name: 'Alice',
      joinDate: null,
    })

    expect(() => normalizeAgentProfile({
      agentCode: '',
      name: 'Alice',
      joinDate: null,
    })).toThrow('代理人编码不能为空')
  })

  it('records create, update, restore, and delete events', () => {
    const agent = Agent.create(toImportedAgent(createAgent()))
    expect(agent.pullDomainEvents().map((event) => event.type)).toEqual(['AgentCreated'])

    agent.updateProfile(toImportedAgent(createAgent({ agency: 'Agency B' })))
    agent.delete()
    agent.restoreDeleted()

    expect(agent.pullDomainEvents().map((event) => event.type)).toEqual([
      'AgentProfileUpdated',
      'AgentDeleted',
      'AgentRestored',
    ])
  })
})

describe('Agent hierarchy domain', () => {
  it('builds direct and management-level hierarchy rows', () => {
    expect(buildAgentHierarchy([
      { agentCode: 'L001', leaderCode: null, designation: 3 },
      { agentCode: 'M001', leaderCode: 'L001', designation: 1 },
      { agentCode: 'A001', leaderCode: 'M001', designation: 1 },
    ])).toEqual([
      { agentCode: 'M001', leaderCode: 'L001', hierarchy: 1 },
      { agentCode: 'A001', leaderCode: 'M001', hierarchy: 1 },
      { agentCode: 'A001', leaderCode: 'L001', hierarchy: 1 },
    ])
  })

  it('rejects missing leaders and cycles', () => {
    expect(() => buildAgentHierarchy([
      { agentCode: 'A001', leaderCode: 'NOPE', designation: 1 },
    ])).toThrow('直属上级不存在: NOPE')

    expect(() => buildAgentHierarchy([
      { agentCode: 'A001', leaderCode: 'B001', designation: 1 },
      { agentCode: 'B001', leaderCode: 'A001', designation: 1 },
    ])).toThrow('代理人层级存在循环')
  })
})

describe('ImportAgentsCommand', () => {
  it('writes profile.created logs for newly imported agents', async () => {
    const runtime = new MemoryAgentRuntime()
    const command = new ImportAgentsCommand({
      agents: [toImportedAgent(createAgent())],
    }, executeWith(runtime))

    const result = await command.execute()

    expect(result).toEqual({
      importedCount: 1,
      createdCount: 1,
      updatedCount: 0,
      deletedCount: 0,
    })
    expect(runtime.logs).toHaveLength(1)
    expect(runtime.logs[0]).toMatchObject({
      agentCode: 'A001',
      category: 'profile',
      action: 'created',
      source: 'ImportAgentsCommand',
    })
    expect(runtime.logs[0].changes.map((change) => change.field)).toEqual([
      'name',
      'joinDate',
      'designation',
      'finacingScheme',
      'leaderCode',
      'lastPromotionDate',
      'agency',
      'division',
      'branch',
      'unit',
    ])
    expect(runtime.events.map((event) => event.type)).toEqual(['AgentCreated'])
  })

  it('skips logs when imported data is unchanged', async () => {
    const existing = createAgent()
    const runtime = new MemoryAgentRuntime([existing])
    const command = new ImportAgentsCommand({
      agents: [toImportedAgent(existing)],
    }, executeWith(runtime))

    const result = await command.execute()

    expect(result).toEqual({
      importedCount: 1,
      createdCount: 0,
      updatedCount: 0,
      deletedCount: 0,
    })
    expect(runtime.logs).toEqual([])
    expect(runtime.events).toEqual([])
  })

  it('logs only changed profile fields', async () => {
    const existing = createAgent()
    const runtime = new MemoryAgentRuntime([existing])
    const command = new ImportAgentsCommand({
      agents: [toImportedAgent(createAgent({
        agency: 'Agency B',
        unit: 'Unit B',
      }))],
    }, executeWith(runtime))

    await command.execute()

    expect(runtime.logs).toHaveLength(1)
    expect(runtime.logs[0].action).toBe('updated')
    expect(runtime.logs[0].changes).toEqual([
      { field: 'agency', before: 'Agency A', after: 'Agency B' },
      { field: 'unit', before: 'Unit A', after: 'Unit B' },
    ])
  })

  it('logs leaderCode changes', async () => {
    const leader = createAgent({
      id: 1,
      agentCode: 'L001',
      name: 'Leader',
      finacingScheme: null,
      lastPromotionDate: null,
    })
    const member = createAgent({
      id: 2,
      agentCode: 'A001',
      leaderCode: null,
    })
    const runtime = new MemoryAgentRuntime([leader, member])
    const command = new ImportAgentsCommand({
      agents: [
        toImportedAgent(leader),
        toImportedAgent(createAgent({
          id: 2,
          leaderCode: 'L001',
        })),
      ],
    }, executeWith(runtime))

    const result = await command.execute()

    expect(result.updatedCount).toBe(1)
    expect(runtime.getRecord('A001')?.leaderCode).toBe('L001')
    expect(runtime.logs.find((log) => log.agentCode === 'A001')?.changes).toEqual([
      { field: 'leaderCode', before: null, after: 'L001' },
    ])
  })

  it('logs deleted agents when import omits active records', async () => {
    const kept = createAgent()
    const removed = createAgent({
      id: 2,
      agentCode: 'B001',
      name: 'Bob',
    })
    const runtime = new MemoryAgentRuntime([kept, removed])
    const command = new ImportAgentsCommand({
      agents: [toImportedAgent(kept)],
    }, executeWith(runtime))

    const result = await command.execute()

    expect(result.deletedCount).toBe(1)
    expect(runtime.logs).toContainEqual({
      agentCode: 'B001',
      category: 'profile',
      action: 'deleted',
      source: 'ImportAgentsCommand',
      changes: [],
    })
  })

  it('writes restored and updated logs in order for deleted agents', async () => {
    const restoredOnly = createAgent({
      id: 1,
      agentCode: 'A001',
      deletedAt: '2026-03-01T00:00:00.000Z',
    })
    const restoredAndChanged = createAgent({
      id: 2,
      agentCode: 'B001',
      name: 'Bob',
      agency: 'Agency Old',
      deletedAt: '2026-03-01T00:00:00.000Z',
    })
    const runtime = new MemoryAgentRuntime([restoredOnly, restoredAndChanged])
    const command = new ImportAgentsCommand({
      agents: [
        toImportedAgent(createAgent()),
        toImportedAgent(createAgent({
          id: 2,
          agentCode: 'B001',
          name: 'Bob',
          agency: 'Agency New',
        })),
      ],
    }, executeWith(runtime))

    await command.execute()

    expect(runtime.logs.map((log) => `${log.agentCode}:${log.action}`)).toEqual([
      'A001:restored',
      'B001:restored',
      'B001:updated',
    ])
    expect(runtime.logs[2].changes).toEqual([
      { field: 'agency', before: 'Agency Old', after: 'Agency New' },
    ])
  })
})

describe('UpdateAgentLastPromotionDateCommand', () => {
  it('skips update and log when the normalized value is unchanged', async () => {
    const runtime = new MemoryAgentRuntime([createAgent()])
    const command = new UpdateAgentLastPromotionDateCommand({
      agentCode: 'a001',
      lastPromotionDate: '2026-03',
    }, executeWith(runtime))

    const result = await command.execute()

    expect(result).toEqual({
      agentCode: 'A001',
      lastPromotionDate: '2026-03-01',
    })
    expect(runtime.logs).toEqual([])
    expect(runtime.events).toEqual([])
    expect(runtime.getRecord('A001')?.lastPromotionDate).toBe('2026-03-01')
  })

  it('writes a profile.updated log when the promotion date changes', async () => {
    const runtime = new MemoryAgentRuntime([createAgent()])
    const command = new UpdateAgentLastPromotionDateCommand({
      agentCode: 'A001',
      lastPromotionDate: '2026-04',
    }, executeWith(runtime))

    await command.execute()

    expect(runtime.getRecord('A001')?.lastPromotionDate).toBe('2026-04-01')
    expect(runtime.events.map((event) => event.type)).toEqual([
      'AgentProfileUpdated',
      'AgentPromotionDateChanged',
    ])
    expect(runtime.logs).toEqual([{
      agentCode: 'A001',
      category: 'profile',
      action: 'updated',
      source: 'UpdateAgentLastPromotionDateCommand',
      changes: [{
        field: 'lastPromotionDate',
        before: '2026-03-01',
        after: '2026-04-01',
      }],
    }])
  })
})
