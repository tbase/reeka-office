import { periodToIndex, type Period } from '../period'
import type { QualificationAssessment } from './assessment'
import { qualificationConfig } from './config'

export class NewAgentQualificationPolicy {
  evaluate(input: {
    startPeriod: Period
    period: Period
    actualSales: number
  }): QualificationAssessment {
    const numMonths = periodToIndex(input.period) - periodToIndex(input.startPeriod) + 1
    const targetSales = Math.max(
      qualificationConfig.newAgentMonthlyTarget * numMonths,
      qualificationConfig.newAgentMonthlyTarget * 2,
    )
    const qualifiedGap = input.actualSales - targetSales

    return {
      isQualified: qualifiedGap >= 0,
      qualifiedGap,
    }
  }
}
