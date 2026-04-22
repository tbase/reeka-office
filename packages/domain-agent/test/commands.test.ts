import { describe, expect, it } from 'vitest'

import {
  ImportAgentsCommand,
  UpdateAgentLastPromotionDateCommand,
  type AppendAgentLogInput,
  type ImportedAgentInput,
} from '../src'

interface AgentRecord {
  id: number
  agentCode: string
  name: string
  joinDate: string | null
  designation: number | null
  finacingScheme: string[] | null
  leaderCode: string | null
  lastPromotionDate: string | null
  agency: string | null
  division: string | null
  branch: string | null
  unit: string | null
  deletedAt: string | null
}

function createAgent(overrides: Partial<AgentRecord> = {}): AgentRecord {
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

function toImportedAgent(agent: AgentRecord): ImportedAgentInput {
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
  hierarchy: Array<{ agentCode: string; leaderCode: string; hierarchy: number }> = []
  private readonly records = new Map<string, AgentRecord>()
  private nextId = 1

  constructor(records: AgentRecord[] = []) {
    for (const record of records) {
      this.records.set(record.agentCode, cloneRecord(record))
      this.nextId = Math.max(this.nextId, record.id + 1)
    }
  }

  async listExistingAgents(agentCodes: string[]) {
    return agentCodes
      .map((agentCode) => this.records.get(agentCode))
      .filter((record): record is AgentRecord => record != null)
      .map(cloneRecord)
  }

  async listActiveAgentCodes() {
    return [...this.records.values()]
      .filter((record) => record.deletedAt == null)
      .map((record) => record.agentCode)
  }

  async insertAgentBase(agent: ImportedAgentInput) {
    this.records.set(agent.agentCode, {
      id: this.nextId,
      agentCode: agent.agentCode,
      name: agent.name,
      joinDate: agent.joinDate,
      designation: agent.designation ?? null,
      finacingScheme: agent.finacingScheme ?? null,
      leaderCode: null,
      lastPromotionDate: agent.lastPromotionDate ?? null,
      agency: agent.agency ?? null,
      division: agent.division ?? null,
      branch: agent.branch ?? null,
      unit: agent.unit ?? null,
      deletedAt: null,
    })
    this.nextId += 1
  }

  async updateAgentBaseById(id: number, agent: ImportedAgentInput) {
    const record = this.findById(id)
    Object.assign(record, {
      name: agent.name,
      joinDate: agent.joinDate,
      designation: agent.designation ?? null,
      finacingScheme: agent.finacingScheme ?? null,
      lastPromotionDate: agent.lastPromotionDate ?? null,
      agency: agent.agency ?? null,
      division: agent.division ?? null,
      branch: agent.branch ?? null,
      unit: agent.unit ?? null,
      deletedAt: null,
    })
  }

  async listCurrentAgents(agentCodes: string[]) {
    return agentCodes
      .map((agentCode) => this.records.get(agentCode))
      .filter((record): record is AgentRecord => record != null)
      .map((record) => ({
        id: record.id,
        agentCode: record.agentCode,
        leaderCode: record.leaderCode,
      }))
  }

  async updateAgentLeaderById(id: number, leaderCode: string | null) {
    this.findById(id).leaderCode = leaderCode
  }

  async softDeleteMissing(agentCodes: string[]) {
    const imported = new Set(agentCodes)
    for (const record of this.records.values()) {
      if (record.deletedAt == null && !imported.has(record.agentCode)) {
        record.deletedAt = '2026-04-01T00:00:00.000Z'
      }
    }
  }

  async listHierarchySourceRows() {
    return [...this.records.values()]
      .filter((record) => record.deletedAt == null)
      .map((record) => ({
        agentCode: record.agentCode,
        leaderCode: record.leaderCode,
        designation: record.designation,
      }))
  }

  async replaceHierarchy(rows: Array<{ agentCode: string; leaderCode: string; hierarchy: number }>) {
    this.hierarchy = rows.map((row) => ({ ...row }))
  }

  async appendAgentLogs(logs: AppendAgentLogInput[]) {
    this.logs.push(...logs.map((log) => ({
      ...log,
      changes: log.changes.map((change) => ({
        ...change,
        before: Array.isArray(change.before) ? [...change.before] : change.before,
        after: Array.isArray(change.after) ? [...change.after] : change.after,
      })),
    })))
  }

  async findActiveAgentByCode(agentCode: string) {
    const record = this.records.get(agentCode)
    if (!record || record.deletedAt != null) {
      return null
    }

    return {
      id: record.id,
      agentCode: record.agentCode,
      lastPromotionDate: record.lastPromotionDate,
    }
  }

  async updateAgentLastPromotionDateById(id: number, lastPromotionDate: string | null) {
    this.findById(id).lastPromotionDate = lastPromotionDate
  }

  getRecord(agentCode: string) {
    const record = this.records.get(agentCode)
    return record ? cloneRecord(record) : null
  }

  private findById(id: number) {
    const record = [...this.records.values()].find((item) => item.id === id)
    if (!record) {
      throw new Error(`Missing agent id: ${id}`)
    }

    return record
  }
}

function cloneRecord(record: AgentRecord): AgentRecord {
  return {
    ...record,
    finacingScheme: record.finacingScheme ? [...record.finacingScheme] : null,
  }
}

describe('ImportAgentsCommand', () => {
  it('writes profile.created logs for newly imported agents', async () => {
    const runtime = new MemoryAgentRuntime()
    const command = new ImportAgentsCommand({
      agents: [toImportedAgent(createAgent())],
    }, {
      executeInTransaction: async (work) => work(runtime),
    })

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
  })

  it('skips logs when imported data is unchanged', async () => {
    const existing = createAgent()
    const runtime = new MemoryAgentRuntime([existing])
    const command = new ImportAgentsCommand({
      agents: [toImportedAgent(existing)],
    }, {
      executeInTransaction: async (work) => work(runtime),
    })

    const result = await command.execute()

    expect(result).toEqual({
      importedCount: 1,
      createdCount: 0,
      updatedCount: 0,
      deletedCount: 0,
    })
    expect(runtime.logs).toEqual([])
  })

  it('logs only changed profile fields', async () => {
    const existing = createAgent()
    const runtime = new MemoryAgentRuntime([existing])
    const command = new ImportAgentsCommand({
      agents: [toImportedAgent(createAgent({
        agency: 'Agency B',
        unit: 'Unit B',
      }))],
    }, {
      executeInTransaction: async (work) => work(runtime),
    })

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
    }, {
      executeInTransaction: async (work) => work(runtime),
    })

    const result = await command.execute()

    expect(result.updatedCount).toBe(1)
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
    }, {
      executeInTransaction: async (work) => work(runtime),
    })

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
    }, {
      executeInTransaction: async (work) => work(runtime),
    })

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
    }, {
      executeInTransaction: async (work) => work(runtime),
    })

    const result = await command.execute()

    expect(result).toEqual({
      agentCode: 'A001',
      lastPromotionDate: '2026-03-01',
    })
    expect(runtime.logs).toEqual([])
    expect(runtime.getRecord('A001')?.lastPromotionDate).toBe('2026-03-01')
  })

  it('writes a profile.updated log when the promotion date changes', async () => {
    const runtime = new MemoryAgentRuntime([createAgent()])
    const command = new UpdateAgentLastPromotionDateCommand({
      agentCode: 'A001',
      lastPromotionDate: '2026-04',
    }, {
      executeInTransaction: async (work) => work(runtime),
    })

    await command.execute()

    expect(runtime.getRecord('A001')?.lastPromotionDate).toBe('2026-04-01')
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
