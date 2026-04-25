export interface QualificationAssessment {
  isQualified: boolean
  qualifiedGap: number
}

export function toQualificationMetricValue(assessment: QualificationAssessment): number {
  return assessment.isQualified ? 100 : 0
}
