import { describe, expect, it } from 'vitest'

import { ManagementQualificationPolicy } from '../src/domain/qualification/managementPolicy'
import { QualificationPolicy, type QualificationFactsProvider } from '../src/domain/qualification/policy'
import type { Period } from '../src/domain/period'

function createFacts(input: {
  personalNsc?: number
  directTeamNsc?: number
  wasQualified?: boolean
} = {}): QualificationFactsProvider {
  return {
    sumPersonalNsc: async () => input.personalNsc ?? 0,
    sumDirectTeamNsc: async () => input.directTeamNsc ?? 0,
    wasQualifiedIn: async () => input.wasQualified ?? false,
  }
}

function createTrackedFacts(input: {
  personalNsc?: number
  directTeamNsc?: number
  wasQualified?: boolean
} = {}) {
  const calls = {
    sumPersonalNsc: 0,
    sumDirectTeamNsc: 0,
    wasQualifiedIn: 0,
  }
  const facts: QualificationFactsProvider = {
    sumPersonalNsc: async () => {
      calls.sumPersonalNsc += 1
      return input.personalNsc ?? 0
    },
    sumDirectTeamNsc: async () => {
      calls.sumDirectTeamNsc += 1
      return input.directTeamNsc ?? 0
    },
    wasQualifiedIn: async () => {
      calls.wasQualifiedIn += 1
      return input.wasQualified ?? false
    },
  }

  return { calls, facts }
}

function period(year: number, month: number): Period {
  return { year, month }
}

describe('QualificationPolicy', () => {
  it('requires new agents to hit the minimum two-month target in their first evaluated month', async () => {
    const policy = new QualificationPolicy()

    const result = await policy.evaluate({
      agent: {
        agentCode: 'A001',
        joinDate: '2026-01-01',
        designation: 1,
        lastPromotionDate: null,
      },
      period: period(2026, 2),
      facts: createFacts({ personalNsc: 3_000_000 }),
    })

    expect(result).toEqual({
      isQualified: false,
      qualifiedGap: -1_000_000,
    })
  })

  it('calculates new-agent cumulative qualification across months', async () => {
    const policy = new QualificationPolicy()

    const result = await policy.evaluate({
      agent: {
        agentCode: 'A001',
        joinDate: '2026-01-01',
        designation: 1,
        lastPromotionDate: null,
      },
      period: period(2026, 2),
      facts: createFacts({ personalNsc: 4_000_000 }),
    })

    expect(result).toEqual({
      isQualified: true,
      qualifiedGap: 0,
    })
  })

  it('lets senior agents carry previous-month qualification outside quarter end', async () => {
    const policy = new QualificationPolicy()
    const { calls, facts } = createTrackedFacts({ wasQualified: true })

    const result = await policy.evaluate({
      agent: {
        agentCode: 'A002',
        joinDate: '2025-01-01',
        designation: 4,
        lastPromotionDate: null,
      },
      period: period(2026, 2),
      facts,
    })

    expect(result).toEqual({
      isQualified: true,
      qualifiedGap: 0,
    })
    expect(calls).toEqual({
      sumPersonalNsc: 0,
      sumDirectTeamNsc: 0,
      wasQualifiedIn: 1,
    })
  })

  it('uses direct-team NSC targets for RM and above', async () => {
    const policy = new QualificationPolicy()

    const result = await policy.evaluate({
      agent: {
        agentCode: 'A003',
        joinDate: '2024-01-01',
        designation: 5,
        lastPromotionDate: null,
      },
      period: period(2026, 4),
      facts: createFacts({ directTeamNsc: 195_000_000 }),
    })

    expect(result).toEqual({
      isQualified: true,
      qualifiedGap: 0,
    })
  })

  it('falls back to quarterly targets at quarter end', async () => {
    const policy = new QualificationPolicy()

    const result = await policy.evaluate({
      agent: {
        agentCode: 'A004',
        joinDate: '2024-01-01',
        designation: 4,
        lastPromotionDate: null,
      },
      period: period(2026, 3),
      facts: createFacts({
        wasQualified: true,
        personalNsc: 4_000_000,
      }),
    })

    expect(result).toEqual({
      isQualified: false,
      qualifiedGap: -1_000_000,
    })
  })

  it('falls back from management rules to senior rules when RM targets are not met', async () => {
    const policy = new QualificationPolicy()

    const result = await policy.evaluate({
      agent: {
        agentCode: 'A005',
        joinDate: '2024-01-01',
        designation: 5,
        lastPromotionDate: null,
      },
      period: period(2026, 4),
      facts: createFacts({
        directTeamNsc: 10_000_000,
        personalNsc: 15_000_000,
      }),
    })

    expect(result).toEqual({
      isQualified: true,
      qualifiedGap: 3_000_000,
    })
  })

  it('loads only the facts needed by the selected rule path', async () => {
    const policy = new QualificationPolicy()
    const { calls, facts } = createTrackedFacts({
      directTeamNsc: 195_000_000,
    })

    const result = await policy.evaluate({
      agent: {
        agentCode: 'A006',
        joinDate: '2024-01-01',
        designation: 5,
        lastPromotionDate: null,
      },
      period: period(2026, 4),
      facts,
    })

    expect(result).toEqual({
      isQualified: true,
      qualifiedGap: 0,
    })
    expect(calls).toEqual({
      sumPersonalNsc: 0,
      sumDirectTeamNsc: 1,
      wasQualifiedIn: 0,
    })
  })
})

describe('ManagementQualificationPolicy', () => {
  it('returns null when a management agent does not meet the direct-team target', () => {
    const policy = new ManagementQualificationPolicy()

    const result = policy.evaluate({
      designation: 5,
      directTeamNsc: 10_000_000,
    })

    expect(result).toBeNull()
  })
})
