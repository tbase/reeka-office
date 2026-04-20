import { getDesignationName } from '@reeka-office/domain-agent'

import type { AgentProfile } from './ports'
import { addMonths, maxPeriod, parseDateToPeriod, type Period } from './period'
import {
  promotionMetricDefinitions,
  promotionTargets,
  type AgentPromotionSnapshot,
  type PromotionMetric,
  type PromotionMetricKey,
} from './promotionMetric'

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

  buildSnapshot(input: {
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
  }): AgentPromotionSnapshot {
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
): PromotionMetric[] {
  return promotionMetricDefinitions
    .map((definition) => {
      const target = targets[definition.key] ?? 0
      if (target <= 0) {
        return null
      }

      const actual = actuals[definition.key] ?? 0

      return {
        key: definition.key,
        label: definition.label,
        format: definition.format,
        actual,
        target,
        difference: actual - target,
        progress: target > 0 ? actual / target : 0,
      } satisfies PromotionMetric
    })
    .filter((metric): metric is PromotionMetric => metric != null)
}
