import { describe, expect, it } from 'vitest'

import { PromotionPolicy } from '../src/domain/promotionPolicy'

describe('PromotionPolicy', () => {
  it('uses the latest of rolling window, last promotion date, and join date as sale start period', () => {
    const policy = new PromotionPolicy()

    const startPeriod = policy.resolveSaleCalculateStartPeriod(
      {
        year: 2026,
        month: 4,
      },
      '2025-09-12',
      '2026-02-01',
    )

    expect(startPeriod).toEqual({
      year: 2026,
      month: 2,
    })
  })

  it('assesses promotion metrics for the next designation', () => {
    const policy = new PromotionPolicy()

    const assessment = policy.assess({
      agent: {
        agentCode: 'A001',
        designation: 2,
        joinDate: '2024-01-01',
        lastPromotionDate: '2025-03-01',
      },
      latestPeriod: {
        year: 2026,
        month: 4,
      },
      saleCalculateStartPeriod: {
        year: 2026,
        month: 1,
      },
      personalSales: 30_000_000,
      personalNetCase: 12,
      teamSales: 150_000_000,
      directTeamSales: 90_000_000,
      qualifiedTeamCount: 4,
      qualifiedDirectCount: 3,
      selfQualifiedCount: 1,
      renewalRateTeamDirect: 82,
    })

    expect(assessment.status).toBe('ready')
    expect(assessment.designation.actualName).toBe('UM')
    expect(assessment.designation.targetName).toBe('SUM')
    expect(assessment.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: 'net_sales_personal',
        actual: 30_000_000,
        target: 28_000_000,
        difference: 2_000_000,
      }),
      expect.objectContaining({
        key: 'num_qualified_team',
        actual: 5,
        target: 4,
      }),
    ]))
  })

  it('returns no-target when there is no next designation target', () => {
    const policy = new PromotionPolicy()

    const assessment = policy.assess({
      agent: {
        agentCode: 'A999',
        designation: 8,
        joinDate: '2020-01-01',
        lastPromotionDate: null,
      },
      latestPeriod: {
        year: 2026,
        month: 4,
      },
      saleCalculateStartPeriod: {
        year: 2025,
        month: 5,
      },
      personalSales: 0,
      personalNetCase: 0,
      teamSales: 0,
      directTeamSales: 0,
      qualifiedTeamCount: 0,
      qualifiedDirectCount: 0,
      selfQualifiedCount: 0,
      renewalRateTeamDirect: 0,
    })

    expect(assessment.status).toBe('no-target')
    expect(assessment.metrics).toEqual([])
  })
})
