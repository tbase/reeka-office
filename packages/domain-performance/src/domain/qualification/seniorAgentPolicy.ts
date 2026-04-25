import { getQuarter, isQuarterEndMonth, type Period } from '../period'
import type { QualificationAssessment } from './assessment'
import { qualificationConfig } from './config'

export class SeniorAgentQualificationPolicy {
  async evaluate(input: {
    period: Period
    wasQualifiedPreviousMonth: () => Promise<boolean>
    actualSalesYearToDate: () => Promise<number>
  }): Promise<QualificationAssessment> {
    if (await input.wasQualifiedPreviousMonth() && !isQuarterEndMonth(input.period)) {
      return {
        isQualified: true,
        qualifiedGap: 0,
      }
    }

    const targetSales = qualificationConfig.seniorQuarterlyTargets[getQuarter(input.period) - 1]
    const qualifiedGap = await input.actualSalesYearToDate() - targetSales

    return {
      isQualified: qualifiedGap >= 0,
      qualifiedGap,
    }
  }
}
