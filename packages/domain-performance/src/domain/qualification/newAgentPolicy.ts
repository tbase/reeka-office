import type { AgentProfile } from '../ports'
import { periodToIndex, type Period } from '../period'
import type { PerformanceReadRepository } from '../repositories'
import type { QualificationAssessment } from './assessment'
import { qualificationConfig, type JoinDateParts } from './support'

export class NewAgentQualificationPolicy {
  private readonly performanceReadRepository: PerformanceReadRepository

  constructor(performanceReadRepository: PerformanceReadRepository) {
    this.performanceReadRepository = performanceReadRepository
  }

  async evaluate(
    agent: AgentProfile,
    joinDate: JoinDateParts,
    period: Period,
  ): Promise<QualificationAssessment> {
    const startPeriod = {
      year: joinDate.year,
      month: joinDate.month,
    }
    const numMonths = periodToIndex(period) - periodToIndex(startPeriod) + 1
    const targetSales = Math.max(
      qualificationConfig.newAgentMonthlyTarget * numMonths,
      qualificationConfig.newAgentMonthlyTarget * 2,
    )
    const actualSales = await this.performanceReadRepository.sumNsc([agent.agentCode], startPeriod, period)
    const qualifiedGap = actualSales - targetSales

    return {
      isQualified: qualifiedGap >= 0,
      qualifiedGap,
    }
  }
}
