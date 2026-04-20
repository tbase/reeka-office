import type { AgentProfile } from '../ports'
import { addMonths, getQuarter, isQuarterEndMonth, type Period } from '../period'
import type { PerformanceReadRepository } from '../repositories'
import type { QualificationAssessment } from './assessment'
import { qualificationConfig } from './support'

export class SeniorAgentQualificationPolicy {
  private readonly performanceReadRepository: PerformanceReadRepository

  constructor(performanceReadRepository: PerformanceReadRepository) {
    this.performanceReadRepository = performanceReadRepository
  }

  async evaluate(
    agent: AgentProfile,
    period: Period,
  ): Promise<QualificationAssessment> {
    const previousPeriod = addMonths(period, -1)
    const previousMetrics = await this.performanceReadRepository.getPerformanceMetrics(agent.agentCode, previousPeriod)
    if (previousMetrics?.isQualified && !isQuarterEndMonth(period)) {
      return {
        isQualified: true,
        qualifiedGap: 0,
      }
    }

    const targetSales = qualificationConfig.seniorQuarterlyTargets[getQuarter(period) - 1]
    const actualSales = await this.performanceReadRepository.sumNsc(
      [agent.agentCode],
      {
        year: period.year,
        month: 1,
      },
      period,
    )
    const qualifiedGap = actualSales - targetSales

    return {
      isQualified: qualifiedGap >= 0,
      qualifiedGap,
    }
  }
}
