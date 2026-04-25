import { getDesignationName } from '@reeka-office/domain-agent'

import type { AgentProfile } from './ports'
import { addMonths, maxPeriod, parseDateToPeriod, type Period } from './period'
import {
  promotionTargets,
  type PromotionMetricKey,
  type PromotionStatus,
} from './promotionMetric'

export interface PromotionAssessmentMetric {
  key: PromotionMetricKey
  actual: number
  target: number
  difference: number
  progress: number
}

export interface PromotionAssessment {
  status: PromotionStatus
  agentCode: string
  designation: {
    actual: number | null
    actualName: ReturnType<typeof getDesignationName>
    target: number | null
    targetName: ReturnType<typeof getDesignationName>
  }
  lastPromotionDate: string | null
  saleCalculateStartPeriod: Period | null
  latestPeriod: Period | null
  metrics: PromotionAssessmentMetric[]
}

export class PromotionPolicy {
  resolveSaleCalculateStartPeriod(
    latestPeriod: Period,
    lastPromotionDate: string | null,
    joinDate: string | null,
  ): Period {
    return maxPeriod([
      addMonths(latestPeriod, -11),
      parseDateToPeriod(lastPromotionDate),
      parseDateToPeriod(joinDate),
    ]) ?? latestPeriod
  }

  assess(input: {
    agent: AgentProfile
    latestPeriod: Period | null
    saleCalculateStartPeriod: Period | null
    personalSales: number
    personalNetCase: number
    teamSales: number
    directTeamSales: number
    qualifiedTeamCount: number
    qualifiedDirectCount: number
    selfQualifiedCount: number
    renewalRateTeamDirect: number
  }): PromotionAssessment {
    const actualDesignation = input.agent.designation
    const targetDesignation = Number.isInteger(actualDesignation)
      ? (actualDesignation as number) + 1
      : null
    const actualDesignationName = getDesignationName(actualDesignation)
    const targetDesignationName = getDesignationName(targetDesignation)
    const targetConfig = targetDesignationName
      ? promotionTargets[targetDesignationName]
      : undefined

    if (!targetDesignationName || !targetConfig) {
      return {
        status: 'no-target',
        agentCode: input.agent.agentCode,
        designation: {
          actual: actualDesignation,
          actualName: actualDesignationName,
          target: targetDesignation,
          targetName: targetDesignationName,
        },
        lastPromotionDate: input.agent.lastPromotionDate,
        saleCalculateStartPeriod: null,
        latestPeriod: input.latestPeriod,
        metrics: [],
      }
    }

    if (!input.latestPeriod || !input.saleCalculateStartPeriod) {
      return {
        status: 'no-performance',
        agentCode: input.agent.agentCode,
        designation: {
          actual: actualDesignation,
          actualName: actualDesignationName,
          target: targetDesignation,
          targetName: targetDesignationName,
        },
        lastPromotionDate: input.agent.lastPromotionDate,
        saleCalculateStartPeriod: null,
        latestPeriod: null,
        metrics: [],
      }
    }

    const actuals: Record<PromotionMetricKey, number> = {
      net_sales_personal: input.personalSales,
      net_sales_team: input.personalSales + input.teamSales,
      net_sales_team_direct: input.personalSales + input.directTeamSales,
      net_case_personal: input.personalNetCase,
      num_qualified_team: input.selfQualifiedCount + input.qualifiedTeamCount,
      num_qualified_team_direct: input.selfQualifiedCount + input.qualifiedDirectCount,
      renewal_rate_team_direct: input.renewalRateTeamDirect,
    }

    return {
      status: 'ready',
      agentCode: input.agent.agentCode,
      designation: {
        actual: actualDesignation,
        actualName: actualDesignationName,
        target: targetDesignation,
        targetName: targetDesignationName,
      },
      lastPromotionDate: input.agent.lastPromotionDate,
      saleCalculateStartPeriod: input.saleCalculateStartPeriod,
      latestPeriod: input.latestPeriod,
      metrics: buildPromotionMetrics(targetConfig, actuals),
    }
  }
}

function buildPromotionMetrics(
  targets: Record<PromotionMetricKey, number>,
  actuals: Record<PromotionMetricKey, number>,
): PromotionAssessmentMetric[] {
  return Object.entries(targets)
    .map(([key, target]) => {
      if (target <= 0) {
        return null
      }

      const actual = actuals[key as PromotionMetricKey] ?? 0

      return {
        key: key as PromotionMetricKey,
        actual,
        target,
        difference: actual - target,
        progress: target > 0 ? actual / target : 0,
      } satisfies PromotionAssessmentMetric
    })
    .filter((metric): metric is PromotionAssessmentMetric => metric != null)
}
