import { describe, expect, it } from 'vitest'

import type { AppendAgentLogInput } from '@reeka-office/domain-agent'
import { RecalculateApmQualificationCommand } from '../src/commands/recalculateApmQualification'
import { Apm } from '../src/domain/apm'
import { toPerformanceMetrics, type ImportedApmMetrics } from '../src/domain/performanceMetrics'
import type { AgentDirectoryPort, AgentProfile, DomainEventStore, TeamHierarchyPort } from '../src/domain/ports'
import type { ApmRepository, PerformanceReadRepository } from '../src/domain/repositories'
import { periodToIndex, type Period } from '../src/domain/period'
import type { PerformanceRuntime } from '../src/application/runtime'

class MemoryApmRepository implements ApmRepository {
  private readonly store = new Map<string, Apm>()
  private nextId = 1
  saveCalls = 0

  async findByKeys(keys: Array<{ agentCode: string; period: Period }>): Promise<Apm[]> {
    return keys
      .map((key) => this.store.get(this.buildKey(key.agentCode, key.period)))
      .filter((entity): entity is Apm => entity != null)
      .map((entity) => Apm.restore(entity.toSnapshot()))
  }

  async save(entity: Apm): Promise<void> {
    this.saveCalls += 1

    if (entity.id == null) {
      entity.assignId(this.nextId)
      this.nextId += 1
    }

    this.store.set(this.buildKey(entity.agentCode, entity.period), Apm.restore(entity.toSnapshot()))
  }

  getSnapshot(agentCode: string, period: Period) {
    return this.store.get(this.buildKey(agentCode, period))?.toSnapshot() ?? null
  }

  resetCounters() {
    this.saveCalls = 0
  }

  private buildKey(agentCode: string, period: Period) {
    return `${agentCode}:${period.year}:${period.month}`
  }
}

class MemoryPerformanceReadRepository implements PerformanceReadRepository {
  constructor(private readonly apmRepository: MemoryApmRepository) {}

  async listPeriods() {
    return []
  }

  async listApm() {
    return []
  }

  async listApmYearlyStats() {
    return []
  }

  async listAvailableYears() {
    return []
  }

  async listCurrentMetrics() {
    return []
  }

  async getAgentHistory() {
    return []
  }

  async listMonthlyMetricValues() {
    return []
  }

  async getPerformanceMetrics(agentCode: string, period: Period) {
    const snapshot = this.apmRepository.getSnapshot(agentCode, period)
    return snapshot ? toPerformanceMetrics(snapshot.metrics) : null
  }

  async sumNsc(agentCodes: string[], startPeriod: Period, endPeriod: Period) {
    return agentCodes.reduce((total, agentCode) => total + this.sumAgentMetric(agentCode, startPeriod, endPeriod), 0)
  }

  async sumSales(agentCodes: string[], startPeriod: Period, endPeriod: Period) {
    return this.sumNsc(agentCodes, startPeriod, endPeriod)
  }

  async sumNetCase() {
    return 0
  }

  async countQualified() {
    return 0
  }

  async getRenewalRate() {
    return 0
  }

  async listAgentCodesForPeriods(periods: Period[]) {
    return periods.flatMap((period) => {
      const snapshot = this.apmRepository.getSnapshot('A001', period)
      return snapshot ? [{ agentCode: 'A001', period }] : []
    })
  }

  private sumAgentMetric(agentCode: string, startPeriod: Period, endPeriod: Period) {
    const periods = [
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
    ]

    return periods.reduce((total, period) => {
      const snapshot = this.apmRepository.getSnapshot(agentCode, period)
      if (!snapshot) {
        return total
      }

      if (
        periodToIndex(snapshot.period) < periodToIndex(startPeriod)
        || periodToIndex(snapshot.period) > periodToIndex(endPeriod)
      ) {
        return total
      }

      return total + snapshot.metrics.nsc
    }, 0)
  }
}

class MemoryAgentDirectoryPort implements AgentDirectoryPort {
  constructor(private readonly profiles: AgentProfile[]) {}

  async listProfiles(agentCodes: string[]) {
    return this.profiles.filter((profile) => agentCodes.includes(profile.agentCode))
  }

  async getPromotionProfile(agentCode: string) {
    return this.profiles.find((profile) => profile.agentCode === agentCode) ?? null
  }
}

class MemoryTeamHierarchyPort implements TeamHierarchyPort {
  async listMemberCodes() {
    return []
  }
}

class MemoryDomainEventStore implements DomainEventStore {
  readonly events: Array<{ type: string }> = []

  async append(events: Array<{ type: string }>) {
    this.events.push(...events)
  }
}

class MemoryAgentLogStore {
  readonly logs: AppendAgentLogInput[] = []

  async append(logs: AppendAgentLogInput[]) {
    this.logs.push(...logs.map((log) => ({
      ...log,
      changes: log.changes.map((change) => ({ ...change })),
    })))
  }
}

async function createRuntime() {
  const apmRepository = new MemoryApmRepository()
  const now = new Date('2026-04-01T00:00:00.000Z')

  for (const period of [
    { year: 2026, month: 4 },
    { year: 2026, month: 5 },
  ] satisfies Period[]) {
    const entity = Apm.create({
      agentCode: 'A001',
      period,
      metrics: createMetrics(period.month === 4 ? 8_000_000 : 9_000_000),
      occurredAt: now,
    })
    await apmRepository.save(entity)
  }

  apmRepository.resetCounters()

  const performanceReadRepository = new MemoryPerformanceReadRepository(apmRepository)
  const agentDirectoryPort = new MemoryAgentDirectoryPort([{
    agentCode: 'A001',
    joinDate: '2026-01-01',
    designation: 1,
    lastPromotionDate: null,
  }])
  const teamHierarchyPort = new MemoryTeamHierarchyPort()
  const domainEventStore = new MemoryDomainEventStore()
  const agentLogStore = new MemoryAgentLogStore()

  return {
    runtime: {
      apmRepository,
      performanceReadRepository,
      agentDirectoryPort,
      teamHierarchyPort,
      domainEventStore,
      agentLogStore,
    } satisfies PerformanceRuntime,
    apmRepository,
    domainEventStore,
    agentLogStore,
  }
}

function createMetrics(nsc: number): ImportedApmMetrics {
  return {
    nsc,
    nscSum: nsc,
    netAfycSum: 0,
    netAfyp: 0,
    netAfypSum: 0,
    netAfypAssigned: 0,
    netAfypAssignedSum: 0,
    nscHp: 0,
    nscHpSum: 0,
    netAfypHp: 0,
    netAfypHpSum: 0,
    netAfypH: 0,
    netAfypHSum: 0,
    netCaseH: 0,
    netCaseHSum: 0,
    netCase: 0,
    netCaseSum: 0,
    netCaseAssigned: 0,
    netCaseAssignedSum: 0,
    isQualified: 100,
    isQualifiedAssigned: 0,
    renewalRateTeam: 8000,
  }
}

describe('RecalculateApmQualificationCommand', () => {
  it('writes logs only for qualification rows that really changed', async () => {
    const { runtime, apmRepository, agentLogStore, domainEventStore } = await createRuntime()
    const command = new RecalculateApmQualificationCommand({
      executeInTransaction: async (work) => work(runtime),
      now: () => new Date('2026-04-10T00:00:00.000Z'),
    })

    const result = await command.execute()

    expect(result).toEqual({
      currentPeriod: { year: 2026, month: 4 },
      nextPeriod: { year: 2026, month: 5 },
      agentCount: 1,
      updatedCount: 2,
      skippedCount: 0,
      gapChanges: [
        {
          agentCode: 'A001',
          agentName: null,
          designation: 1,
          joinDate: '2026-01-01',
          lastPromotionDate: null,
          period: { year: 2026, month: 4 },
          field: 'qualifiedGap',
          before: null,
          after: 0,
        },
        {
          agentCode: 'A001',
          agentName: null,
          designation: 1,
          joinDate: '2026-01-01',
          lastPromotionDate: null,
          period: { year: 2026, month: 4 },
          field: 'qualifiedGapNextMonth',
          before: null,
          after: 7_000_000,
        },
        {
          agentCode: 'A001',
          agentName: null,
          designation: 1,
          joinDate: '2026-01-01',
          lastPromotionDate: null,
          period: { year: 2026, month: 5 },
          field: 'qualifiedGap',
          before: null,
          after: 7_000_000,
        },
      ],
    })
    expect(apmRepository.saveCalls).toBe(2)
    expect(domainEventStore.events.filter((event) => event.type === 'QualificationRecalculated')).toHaveLength(2)
    expect(agentLogStore.logs).toEqual([
      {
        agentCode: 'A001',
        category: 'apm',
        action: 'updated',
        periodYear: 2026,
        periodMonth: 4,
        source: 'RecalculateApmQualificationCommand',
        changes: [
          { field: 'qualifiedGap', before: null, after: 0 },
          { field: 'isQualifiedNextMonth', before: null, after: 100 },
          { field: 'qualifiedGapNextMonth', before: null, after: 7_000_000 },
        ],
      },
      {
        agentCode: 'A001',
        category: 'apm',
        action: 'updated',
        periodYear: 2026,
        periodMonth: 5,
        source: 'RecalculateApmQualificationCommand',
        changes: [
          { field: 'qualifiedGap', before: null, after: 7_000_000 },
        ],
      },
    ])
  })

  it('does not write logs when qualification fields already match', async () => {
    const { runtime, apmRepository, agentLogStore, domainEventStore } = await createRuntime()

    const currentSnapshot = apmRepository.getSnapshot('A001', { year: 2026, month: 4 })
    const nextSnapshot = apmRepository.getSnapshot('A001', { year: 2026, month: 5 })

    if (!currentSnapshot || !nextSnapshot) {
      throw new Error('Missing seeded APM snapshots')
    }

    const currentEntity = Apm.restore(currentSnapshot)
    currentEntity.refreshCurrentQualification({
      qualifiedGap: 0,
      isQualifiedNextMonth: 100,
      qualifiedGapNextMonth: 7_000_000,
    }, new Date('2026-04-05T00:00:00.000Z'))
    await apmRepository.save(currentEntity)

    const nextEntity = Apm.restore(nextSnapshot)
    nextEntity.refreshProjectedQualification(7_000_000, new Date('2026-04-05T00:00:00.000Z'))
    await apmRepository.save(nextEntity)
    apmRepository.resetCounters()

    const command = new RecalculateApmQualificationCommand({
      executeInTransaction: async (work) => work(runtime),
      now: () => new Date('2026-04-10T00:00:00.000Z'),
    })

    const result = await command.execute()

    expect(result.updatedCount).toBe(0)
    expect(result.gapChanges).toEqual([])
    expect(apmRepository.saveCalls).toBe(0)
    expect(agentLogStore.logs).toEqual([])
    expect(domainEventStore.events).toEqual([])
  })
})
