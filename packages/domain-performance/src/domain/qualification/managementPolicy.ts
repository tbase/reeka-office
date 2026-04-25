import type { QualificationAssessment } from './assessment'
import { rmDesignation, seniorTeamNscTargets } from './config'

export class ManagementQualificationPolicy {
  evaluate(input: {
    designation: number
    directTeamNsc: number
  }): QualificationAssessment | null {
    const targetBase = seniorTeamNscTargets[input.designation - rmDesignation]
    if (targetBase == null) {
      return null
    }

    if (input.directTeamNsc - targetBase * 100 < 0) {
      return null
    }

    return {
      isQualified: true,
      qualifiedGap: 0,
    }
  }
}
