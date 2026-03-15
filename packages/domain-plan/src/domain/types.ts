export type PlanStatus = 'draft' | 'published' | 'archived'
export type PlanTaskType = 'normal' | 'metric'
export type PlanTaskStatus = 'active' | 'archived'
export type PlanEnrollmentStatus = 'active' | 'eligible' | 'graduated' | 'cancelled'
export type PlanTaskCompletionMode = 'checkin' | 'metric'

export interface CheckinEvidence {
  fileIds: string[]
}

export interface GraduationEvaluation {
  requiredTaskIds: number[]
  completedTaskIds: number[]
  isEligible: boolean
}
