import { describe, expect, it } from 'vitest'

import { ManagementQualificationPolicy } from '../src/domain/qualification/managementPolicy'
import { QualificationPolicy } from '../src/domain/qualification/policy'
import type { TeamHierarchyPort } from '../src/domain/ports'
import type { PerformanceMetrics } from '../src/domain/performanceMetrics'
import type { PerformanceReadRepository } from '../src/domain/repositories'

function createReadRepository(overrides: Partial<PerformanceReadRepository> = {}): PerformanceReadRepository {
  return {
    listPeriods: async () => [],
    listApm: async () => [],
    listApmYearlyStats: async () => [],
    listAvailableYears: async () => [],
    listCurrentMetrics: async () => [],
    getAgentHistory: async () => [],
    listMonthlyMetricValues: async () => [],
    getPerformanceMetrics: async () => null,
    sumNsc: async () => 0,
    sumSales: async () => 0,
    sumNetCase: async () => 0,
    countQualified: async () => 0,
    getRenewalRate: async () => 0,
    listAgentCodesForPeriods: async () => [],
    ...overrides,
  }
}

function createTeamHierarchyPort(memberCodes: string[] = []): TeamHierarchyPort {
  return {
    listMemberCodes: async () => memberCodes,
  }
}

function createQualifiedMetrics(): PerformanceMetrics {
  return {
    nsc: 0,
    nscSum: 0,
    netCase: 0,
    netCaseSum: 0,
    isQualified: true,
    qualifiedGap: 0,
    netAfyp: 0,
    netAfypSum: 0,
    netAfycSum: 0,
    nscHp: 0,
    nscHpSum: 0,
    netAfypHp: 0,
    netAfypHpSum: 0,
    netAfypH: 0,
    netAfypHSum: 0,
    netCaseH: 0,
    netCaseHSum: 0,
    renewalRateTeam: 0,
    isQualifiedNextMonth: null,
    qualifiedGapNextMonth: null,
  }
}

describe('QualificationPolicy', () => {
  it('requires new agents to hit the minimum two-month target in their first evaluated month', async () => {
    const policy = new QualificationPolicy(
      createReadRepository({
        sumNsc: async () => 3_000_000,
      }),
      createTeamHierarchyPort(),
    )

    const result = await policy.evaluate({
      agentCode: 'A001',
      joinDate: '2026-01-01',
      designation: 1,
      lastPromotionDate: null,
    }, {
      year: 2026,
      month: 2,
    })

    expect(result).toEqual({
      isQualified: false,
      qualifiedGap: -1_000_000,
    })
  })

  it('calculates new-agent cumulative qualification across months', async () => {
    const policy = new QualificationPolicy(
      createReadRepository({
        sumNsc: async () => 4_000_000,
      }),
      createTeamHierarchyPort(),
    )

    const result = await policy.evaluate({
      agentCode: 'A001',
      joinDate: '2026-01-01',
      designation: 1,
      lastPromotionDate: null,
    }, {
      year: 2026,
      month: 2,
    })

    expect(result).toEqual({
      isQualified: true,
      qualifiedGap: 0,
    })
  })

  it('lets senior agents carry previous-month qualification outside quarter end', async () => {
    const policy = new QualificationPolicy(
      createReadRepository({
        getPerformanceMetrics: async () => createQualifiedMetrics(),
      }),
      createTeamHierarchyPort(),
    )

    const result = await policy.evaluate({
      agentCode: 'A002',
      joinDate: '2025-01-01',
      designation: 4,
      lastPromotionDate: null,
    }, {
      year: 2026,
      month: 2,
    })

    expect(result).toEqual({
      isQualified: true,
      qualifiedGap: 0,
    })
  })

  it('uses direct-team NSC targets for RM and above', async () => {
    const policy = new QualificationPolicy(
      createReadRepository({
        sumNsc: async () => 195_000_000,
      }),
      createTeamHierarchyPort(['B001', 'B002']),
    )

    const result = await policy.evaluate({
      agentCode: 'A003',
      joinDate: '2024-01-01',
      designation: 5,
      lastPromotionDate: null,
    }, {
      year: 2026,
      month: 4,
    })

    expect(result).toEqual({
      isQualified: true,
      qualifiedGap: 0,
    })
  })

  it('falls back to quarterly targets at quarter end', async () => {
    const policy = new QualificationPolicy(
      createReadRepository({
        getPerformanceMetrics: async () => createQualifiedMetrics(),
        sumNsc: async () => 4_000_000,
      }),
      createTeamHierarchyPort(),
    )

    const result = await policy.evaluate({
      agentCode: 'A004',
      joinDate: '2024-01-01',
      designation: 4,
      lastPromotionDate: null,
    }, {
      year: 2026,
      month: 3,
    })

    expect(result).toEqual({
      isQualified: false,
      qualifiedGap: -1_000_000,
    })
  })

  it('falls back from management rules to senior rules when RM targets are not met', async () => {
    const policy = new QualificationPolicy(
      createReadRepository({
        sumNsc: async (agentCodes) => agentCodes.length > 1 ? 10_000_000 : 15_000_000,
      }),
      createTeamHierarchyPort(['B001', 'B002']),
    )

    const result = await policy.evaluate({
      agentCode: 'A005',
      joinDate: '2024-01-01',
      designation: 5,
      lastPromotionDate: null,
    }, {
      year: 2026,
      month: 4,
    })

    expect(result).toEqual({
      isQualified: true,
      qualifiedGap: 3_000_000,
    })
  })
})

describe('ManagementQualificationPolicy', () => {
  it('returns null when a management agent does not meet the direct-team target', async () => {
    const policy = new ManagementQualificationPolicy(
      createReadRepository({
        sumNsc: async () => 10_000_000,
      }),
      createTeamHierarchyPort(['B001']),
    )

    const result = await policy.evaluate({
      agentCode: 'A006',
      joinDate: '2024-01-01',
      designation: 5,
      lastPromotionDate: null,
    }, {
      year: 2026,
      month: 4,
    })

    expect(result).toBeNull()
  })
})
