import type { CheckinEvidence, PlanTaskCompletionMode } from '../types'
import { normalizeOptionalText } from '../shared/validation'

export interface CompletedTaskSnapshot {
  id: number | null
  enrollmentId: number
  taskId: number
  completionMode: PlanTaskCompletionMode
  completedAt: Date
  evidence: CheckinEvidence | null
  remark: string | null
}

export interface PendingTaskCompletion {
  taskId: number
  completionMode: PlanTaskCompletionMode
  pointItemId: number | null
  occurredAt: Date
}

export class CompletedTask {
  private props: CompletedTaskSnapshot
  private shouldEmit = false
  private pointItemId: number | null

  private constructor(props: CompletedTaskSnapshot, pointItemId: number | null, shouldEmit: boolean) {
    this.props = props
    this.pointItemId = pointItemId
    this.shouldEmit = shouldEmit
  }

  static createCheckin(input: {
    enrollmentId: number
    taskId: number
    completedAt: Date
    evidence: CheckinEvidence
    remark?: string | null
    pointItemId?: number | null
  }): CompletedTask {
    return new CompletedTask({
      id: null,
      enrollmentId: input.enrollmentId,
      taskId: input.taskId,
      completionMode: 'checkin',
      completedAt: input.completedAt,
      evidence: {
        fileIds: input.evidence.fileIds.map((item) => item.trim()).filter((item) => item.length > 0),
      },
      remark: normalizeOptionalText(input.remark),
    }, input.pointItemId ?? null, true)
  }

  static createMetric(input: {
    enrollmentId: number
    taskId: number
    completedAt: Date
    remark?: string | null
    pointItemId?: number | null
  }): CompletedTask {
    return new CompletedTask({
      id: null,
      enrollmentId: input.enrollmentId,
      taskId: input.taskId,
      completionMode: 'metric',
      completedAt: input.completedAt,
      evidence: null,
      remark: normalizeOptionalText(input.remark),
    }, input.pointItemId ?? null, true)
  }

  static restore(snapshot: CompletedTaskSnapshot): CompletedTask {
    return new CompletedTask(snapshot, null, false)
  }

  get id() {
    return this.props.id
  }

  get taskId() {
    return this.props.taskId
  }

  get pointRewardItemId() {
    return this.pointItemId
  }

  assignId(id: number) {
    this.props.id = id
  }

  assignEnrollmentId(enrollmentId: number) {
    this.props.enrollmentId = enrollmentId
  }

  pullCompletionEventMeta(): PendingTaskCompletion | null {
    if (!this.shouldEmit) {
      return null
    }

    this.shouldEmit = false

    return {
      taskId: this.props.taskId,
      completionMode: this.props.completionMode,
      pointItemId: this.pointItemId,
      occurredAt: this.props.completedAt,
    }
  }

  toSnapshot(): CompletedTaskSnapshot {
    return { ...this.props }
  }
}
