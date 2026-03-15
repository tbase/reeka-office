import type {
  DomainEvent,
  PlanAssigned,
  PlanEnrollmentBecameEligible,
  PlanEnrollmentCancelled,
  PlanEnrollmentGraduated,
  PlanTaskCompleted,
} from '../events'
import type { CheckinEvidence, GraduationEvaluation, PlanEnrollmentStatus } from '../types'
import type { PlanTaskSnapshot } from '../plan/plan-task'
import { AggregateRoot } from '../shared/aggregate-root'
import { normalizeRequiredText } from '../shared/validation'
import {
  CompletedTask,
  type CompletedTaskSnapshot,
} from './completed-task'

export interface PlanEnrollmentSnapshot {
  id: number | null
  planId: number
  agentCode: string
  status: PlanEnrollmentStatus
  assignedAt: Date
  startedAt: Date
  eligibleAt: Date | null
  graduatedAt: Date | null
  cancelledAt: Date | null
}

export class PlanEnrollment extends AggregateRoot<PlanEnrollmentSnapshot, DomainEvent> {
  private readonly completedTasks: CompletedTask[]
  private pendingAssigned = false

  private constructor(
    props: PlanEnrollmentSnapshot,
    completedTasks: CompletedTask[],
    pendingAssigned: boolean,
  ) {
    super(props)
    this.completedTasks = completedTasks
    this.pendingAssigned = pendingAssigned
  }

  static assign(input: { planId: number; agentCode: string; assignedAt?: Date }): PlanEnrollment {
    const assignedAt = input.assignedAt ?? new Date()

    return new PlanEnrollment({
      id: null,
      planId: input.planId,
      agentCode: normalizeRequiredText(input.agentCode, '代理人编码'),
      status: 'active',
      assignedAt,
      startedAt: assignedAt,
      eligibleAt: null,
      graduatedAt: null,
      cancelledAt: null,
    }, [], true)
  }

  static restore(input: {
    root: PlanEnrollmentSnapshot
    completedTasks: CompletedTaskSnapshot[]
  }): PlanEnrollment {
    return new PlanEnrollment(
      input.root,
      input.completedTasks.map((item) => CompletedTask.restore(item)),
      false,
    )
  }

  get planId() {
    return this.props.planId
  }

  get agentCode() {
    return this.props.agentCode
  }

  get status() {
    return this.props.status
  }

  override assignId(id: number) {
    super.assignId(id)
    for (const task of this.completedTasks) {
      task.assignEnrollmentId(id)
    }
  }

  submitCheckin(
    task: Pick<PlanTaskSnapshot, 'id' | 'planId' | 'taskType' | 'pointItemId'>,
    evidence: CheckinEvidence,
    completedAt = new Date(),
    remark?: string | null,
  ) {
    this.ensureMutable()
    this.ensureTaskBelongsToPlan(task)
    if (task.taskType !== 'normal') {
      throw new Error('指标任务不能通过普通打卡完成')
    }

    if (this.hasCompletedTask(task.id!)) {
      throw new Error('该任务已完成，无需重复打卡')
    }

    this.completedTasks.push(CompletedTask.createCheckin({
      enrollmentId: this.id ?? 0,
      taskId: task.id!,
      completedAt,
      evidence,
      remark,
      pointItemId: task.pointItemId,
    }))
  }

  completeMetricTask(
    task: Pick<PlanTaskSnapshot, 'id' | 'planId' | 'taskType' | 'pointItemId'>,
    remark?: string | null,
    completedAt = new Date(),
  ) {
    this.ensureMutable()
    this.ensureTaskBelongsToPlan(task)
    if (task.taskType !== 'metric') {
      throw new Error('普通任务不能通过指标完成命令提交')
    }

    if (this.hasCompletedTask(task.id!)) {
      throw new Error('该任务已完成，无需重复提交')
    }

    this.completedTasks.push(CompletedTask.createMetric({
      enrollmentId: this.id ?? 0,
      taskId: task.id!,
      completedAt,
      remark,
      pointItemId: task.pointItemId,
    }))
  }

  recalculateEligibility(requiredTaskIds: number[], now = new Date()): GraduationEvaluation {
    if (this.props.status === 'graduated' || this.props.status === 'cancelled') {
      return this.evaluateEligibility(requiredTaskIds)
    }

    const evaluation = this.evaluateEligibility(requiredTaskIds)
    if (evaluation.isEligible && this.props.status === 'active') {
      this.props.status = 'eligible'
      this.props.eligibleAt = now
      this.record({
        type: 'PlanEnrollmentBecameEligible',
        enrollmentId: this.requireId('计划实例尚未持久化'),
        planId: this.props.planId,
        agentCode: this.props.agentCode,
        occurredAt: now,
      } satisfies PlanEnrollmentBecameEligible)
    }

    if (!evaluation.isEligible && this.props.status === 'eligible') {
      this.props.status = 'active'
      this.props.eligibleAt = null
    }

    return evaluation
  }

  graduate(now = new Date()) {
    if (this.props.status !== 'eligible') {
      throw new Error('当前计划实例尚未满足毕业条件')
    }

    this.props.status = 'graduated'
    this.props.graduatedAt = now
    this.record({
      type: 'PlanEnrollmentGraduated',
      enrollmentId: this.requireId('计划实例尚未持久化'),
      planId: this.props.planId,
      agentCode: this.props.agentCode,
      occurredAt: now,
    } satisfies PlanEnrollmentGraduated)
  }

  cancel(now = new Date()) {
    if (this.props.status === 'graduated') {
      throw new Error('已毕业的计划实例不能取消')
    }

    if (this.props.status === 'cancelled') {
      return
    }

    this.props.status = 'cancelled'
    this.props.cancelledAt = now
    this.record({
      type: 'PlanEnrollmentCancelled',
      enrollmentId: this.requireId('计划实例尚未持久化'),
      planId: this.props.planId,
      agentCode: this.props.agentCode,
      occurredAt: now,
    } satisfies PlanEnrollmentCancelled)
  }

  hasCompletedTask(taskId: number): boolean {
    return this.completedTasks.some((item) => item.taskId === taskId)
  }

  getCompletedTaskId(taskId: number): number | null {
    return this.completedTasks.find((item) => item.taskId === taskId)?.id ?? null
  }

  pullAssignedEvent(): PlanAssigned | null {
    if (!this.pendingAssigned) {
      return null
    }

    this.pendingAssigned = false

    return {
      type: 'PlanAssigned',
      enrollmentId: this.requireId('计划实例尚未持久化'),
      planId: this.props.planId,
      agentCode: this.props.agentCode,
      occurredAt: this.props.assignedAt,
    }
  }

  pullCompletedTaskEvents(): PlanTaskCompleted[] {
    return this.completedTasks.flatMap((completedTask) => {
      const meta = completedTask.pullCompletionEventMeta()
      if (!meta || !completedTask.id) {
        return []
      }

      return [{
        type: 'PlanTaskCompleted',
        enrollmentId: this.requireId('计划实例尚未持久化'),
        completionId: completedTask.id,
        planId: this.props.planId,
        taskId: meta.taskId,
        agentCode: this.props.agentCode,
        completionMode: meta.completionMode,
        pointItemId: meta.pointItemId,
        occurredAt: meta.occurredAt,
      } satisfies PlanTaskCompleted]
    })
  }

  toSnapshot() {
    return {
      root: { ...this.props },
      completedTasks: this.completedTasks.map((item) => item.toSnapshot()),
    }
  }

  private ensureMutable() {
    if (this.props.status !== 'active' && this.props.status !== 'eligible') {
      throw new Error('当前计划实例不可再提交任务')
    }
  }

  private ensureTaskBelongsToPlan(task: Pick<PlanTaskSnapshot, 'id' | 'planId'>) {
    if (!task.id || task.planId !== this.props.planId) {
      throw new Error('任务不属于当前计划实例')
    }
  }

  private evaluateEligibility(requiredTaskIds: number[]): GraduationEvaluation {
    const completedTaskIds = this.completedTasks.map((item) => item.taskId)
    const completedTaskIdSet = new Set(completedTaskIds)

    return {
      requiredTaskIds,
      completedTaskIds,
      isEligible: requiredTaskIds.every((taskId) => completedTaskIdSet.has(taskId)),
    }
  }
}

export function getPlanEnrollmentPersistenceState(enrollment: PlanEnrollment): {
  completedTasks: CompletedTask[]
} {
  const state = enrollment as unknown as {
    completedTasks: CompletedTask[]
  }

  return {
    completedTasks: [...state.completedTasks],
  }
}
