import { describe, expect, it } from 'vitest'

import { ImportApmCommand, type ImportApmItem } from '../src/commands/importApm'
import { Apm } from '../src/domain/apm'
import { toPerformanceMetrics } from '../src/domain/performanceMetrics'
import type { AgentDirectoryPort, AgentProfile, DomainEventStore, TeamHierarchyPort } from '../src/domain/ports'
import type { ApmRepository, PerformanceReadRepository } from '../src/domain/repositories'
import { periodToIndex, type Period } from '../src/domain/period'
import type { PerformanceRuntime } from '../src/infra/defaultDeps'

class MemoryApmRepository implements ApmRepository {
  private readonly store = new Map<string, Apm>()
  private nextId = 1

  async findByKeys(keys: Array<{ agentCode: string; period: Period }>): Promise<Apm[]> {
    return keys
      .map((key) => this.store.get(this.buildKey(key.agentCode, key.period)))
      .filter((entity): entity is Apm => entity != null)
      .map((entity) => Apm.restore(entity.toSnapshot()))
  }

  async save(entity: Apm): Promise<void> {
    if (entity.id == null) {
      entity.assignId(this.nextId)
      this.nextId += 1
    }

    this.store.set(this.buildKey(entity.agentCode, entity.period), Apm.restore(entity.toSnapshot()))
  }

  getSnapshot(agentCode: string, period: Period) {
    return this.store.get(this.buildKey(agentCode, period))?.toSnapshot() ?? null
  }

  listSnapshots() {
    return [...this.store.values()].map((entity) => entity.toSnapshot())
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
    return this.sum(agentCodes, startPeriod, endPeriod, 'nsc')
  }

  async sumSales(agentCodes: string[], startPeriod: Period, endPeriod: Period) {
    return this.sum(agentCodes, startPeriod, endPeriod, 'sales')
  }

  async sumNetCase(agentCodes: string[], startPeriod: Period, endPeriod: Period) {
    return this.sum(agentCodes, startPeriod, endPeriod, 'netCase')
  }

  async countQualified(agentCodes: string[], period: Period) {
    return agentCodes.reduce((count, agentCode) => {
      const metrics = this.apmRepository.getSnapshot(agentCode, period)?.metrics
      return count + (metrics && metrics.isQualified > 0 ? 1 : 0)
    }, 0)
  }

  async getRenewalRate(agentCode: string, period: Period) {
    const metrics = this.apmRepository.getSnapshot(agentCode, period)?.metrics
    return Number(metrics?.renewalRateTeam ?? 0) / 100
  }

  async listAgentCodesForPeriods(periods: Period[]) {
    return periods.flatMap(() => [])
  }

  private sum(
    agentCodes: string[],
    startPeriod: Period,
    endPeriod: Period,
    metric: 'nsc' | 'sales' | 'netCase',
  ) {
    return Promise.resolve(
      this.apmRepository
        .listSnapshots()
        .filter((snapshot) =>
          agentCodes.includes(snapshot.agentCode)
          && periodToIndex(snapshot.period) >= periodToIndex(startPeriod)
          && periodToIndex(snapshot.period) <= periodToIndex(endPeriod),
        )
        .reduce((total, snapshot) => total + (
          metric === 'nsc'
            ? snapshot.metrics.nsc
            : metric === 'sales'
              ? snapshot.metrics.nsc + snapshot.metrics.netAfypAssigned
              : snapshot.metrics.netCase
        ), 0),
    )
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
  constructor(private readonly map: Record<string, string[]>) {}

  async listMemberCodes(leaderCode: string) {
    return this.map[leaderCode] ?? []
  }
}

class MemoryDomainEventStore implements DomainEventStore {
  readonly events: Array<{ type: string }> = []

  async append(events: Array<{ type: string }>) {
    this.events.push(...events)
  }
}

function createRuntime(input: {
  profiles: AgentProfile[]
  hierarchy?: Record<string, string[]>
  seed?: Array<{ agentCode: string; period: Period; item: ImportApmItem }>
}) {
  const apmRepository = new MemoryApmRepository()

  return Promise.all((input.seed ?? []).map(async (entry) => {
    const entity = Apm.create({
      agentCode: entry.agentCode,
      period: entry.period,
      metrics: entry.item,
      occurredAt: new Date('2026-04-01T00:00:00.000Z'),
    })
    await apmRepository.save(entity)
  })).then(() => {
    const performanceReadRepository = new MemoryPerformanceReadRepository(apmRepository)
    const agentDirectoryPort = new MemoryAgentDirectoryPort(input.profiles)
    const teamHierarchyPort = new MemoryTeamHierarchyPort(input.hierarchy ?? {})
    const domainEventStore = new MemoryDomainEventStore()

    return {
      runtime: {
        apmRepository,
        performanceReadRepository,
        agentDirectoryPort,
        teamHierarchyPort,
        domainEventStore,
      } satisfies PerformanceRuntime,
      apmRepository,
      domainEventStore,
    }
  })
}

function createImportItem(overrides: Partial<ImportApmItem> = {}): ImportApmItem {
  return {
    agentCode: 'A001',
    year: 2026,
    month: 4,
    nsc: 8_000_000,
    nscSum: 8_000_000,
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
    ...overrides,
  }
}

describe('ImportApmCommand', () => {
  it('rejects duplicated agent-period rows in one import batch', async () => {
    const { runtime } = await createRuntime({
      profiles: [{
        agentCode: 'A001',
        joinDate: '2026-01-01',
        designation: 1,
        lastPromotionDate: null,
      }],
    })

    const command = new ImportApmCommand({
      items: [
        createImportItem(),
        createImportItem(),
      ],
    }, {
      executeInTransaction: async (work) => work(runtime),
      now: () => new Date('2026-04-10T00:00:00.000Z'),
    })

    await expect(command.execute()).rejects.toThrow('CSV 中存在重复的代理人月份记录')
  })

  it('skips unknown agents and recalculates current and next-month qualification fields', async () => {
    const nextPeriod = {
      year: 2026,
      month: 5,
    }
    const { runtime, apmRepository, domainEventStore } = await createRuntime({
      profiles: [{
        agentCode: 'A001',
        joinDate: '2026-01-01',
        designation: 1,
        lastPromotionDate: null,
      }],
      seed: [{
        agentCode: 'A001',
        period: nextPeriod,
        item: createImportItem({
          year: 2026,
          month: 5,
          nsc: 1_000_000,
          nscSum: 9_000_000,
        }),
      }],
    })

    const command = new ImportApmCommand({
      items: [
        createImportItem(),
        createImportItem({
          agentCode: 'UNKNOWN',
        }),
      ],
    }, {
      executeInTransaction: async (work) => work(runtime),
      now: () => new Date('2026-04-10T00:00:00.000Z'),
    })

    const result = await command.execute()

    expect(result).toEqual({
      processedCount: 1,
      createdCount: 1,
      updatedCount: 0,
    })

    expect(apmRepository.getSnapshot('A001', {
      year: 2026,
      month: 4,
    })?.metrics).toEqual(expect.objectContaining({
      qualifiedGap: 0,
      isQualifiedNextMonth: false,
      qualifiedGapNextMonth: -1_000_000,
    }))
    expect(apmRepository.getSnapshot('A001', nextPeriod)?.metrics.qualifiedGap).toBe(-1_000_000)
    expect(domainEventStore.events.some((event) => event.type === 'QualificationRecalculated')).toBe(true)
  })
})
