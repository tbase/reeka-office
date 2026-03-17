import { and, asc, eq } from 'drizzle-orm'

import { getDb, type DBExecutor, withTransaction } from '../context'
import type { PlanTaskCompleted } from '../domain/events'
import type { DomainEventStore, PlanRewardPort } from '../domain/ports'
import { PlanEnrollment } from '../domain/enrollment/plan-enrollment'
import { DrizzleDomainEventStore } from '../infrastructure/domain-event-store'
import { DrizzlePlanEnrollmentRepository } from '../infrastructure/plan-enrollment-repository'
import { DrizzlePlanRepository } from '../infrastructure/plan-repository'
import { DomainPointPlanRewardPort } from '../infrastructure/point-reward-port'
import type { TenantScope } from '../scope'
import { planDomainEvents } from '../schema'

async function requireEnrollment(db: DBExecutor, scope: TenantScope, enrollmentId: number): Promise<PlanEnrollment> {
  const repository = new DrizzlePlanEnrollmentRepository(db, scope.tenantId)
  const enrollment = await repository.findById(enrollmentId)
  if (!enrollment) {
    throw new Error('计划实例不存在')
  }

  return enrollment
}

async function persistEnrollmentAndEvents(
  db: DBExecutor,
  scope: TenantScope,
  enrollment: PlanEnrollment,
  eventStore: DomainEventStore,
): Promise<PlanTaskCompleted[]> {
  const enrollmentRepository = new DrizzlePlanEnrollmentRepository(db, scope.tenantId)
  await enrollmentRepository.save(enrollment)

  const assignedEvent = enrollment.pullAssignedEvent()
  const completionEvents = enrollment.pullCompletedTaskEvents()
  const otherEvents = enrollment.pullDomainEvents()
  const events = [
    ...(assignedEvent ? [assignedEvent] : []),
    ...completionEvents,
    ...otherEvents,
  ]

  await eventStore.append(events)
  return completionEvents
}

function toRewardEvent(payload: Record<string, unknown>): {
  completionId: number
  agentId: number
  pointItemId: number
} | null {
  const completionId = payload.completionId
  const agentId = payload.agentId
  const pointItemId = payload.pointItemId

  if (
    typeof completionId !== 'number'
    || typeof agentId !== 'number'
    || typeof pointItemId !== 'number'
  ) {
    return null
  }

  return {
    completionId,
    agentId,
    pointItemId,
  }
}

export interface AssignPlanToAgentInput {
  planId: number
  agentId: number
  assignedAt?: Date
}

export class AssignPlanToAgentCommand {
  private readonly scope: TenantScope
  private readonly input: AssignPlanToAgentInput

  constructor(scope: TenantScope, input: AssignPlanToAgentInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<number | null> {
    return withTransaction(async (tx) => {
      const planRepository = new DrizzlePlanRepository(tx, this.scope.tenantId)
      const enrollmentRepository = new DrizzlePlanEnrollmentRepository(tx, this.scope.tenantId)
      const eventStore = new DrizzleDomainEventStore(tx, this.scope.tenantId)

      const plan = await planRepository.findById(this.input.planId)
      if (!plan) {
        throw new Error('计划不存在')
      }

      if (plan.status !== 'published') {
        throw new Error('只有已发布的计划可被指派')
      }

      const existed = await enrollmentRepository.findByPlanAndAgent(this.input.planId, this.input.agentId)
      if (existed) {
        throw new Error('该代理人已参与当前计划')
      }

      const enrollment = PlanEnrollment.assign(this.input)
      enrollment.recalculateEligibility(plan.getRequiredActiveTaskIds(), this.input.assignedAt ?? new Date())
      await persistEnrollmentAndEvents(tx, this.scope, enrollment, eventStore)
      return enrollment.id
    })
  }
}

export interface SubmitPlanTaskCheckinInput {
  enrollmentId: number
  taskId: number
  evidenceFileIds: string[]
  remark?: string | null
  completedAt?: Date
}

export class SubmitPlanTaskCheckinCommand {
  private readonly scope: TenantScope
  private readonly input: SubmitPlanTaskCheckinInput

  constructor(scope: TenantScope, input: SubmitPlanTaskCheckinInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<number | null> {
    return withTransaction(async (tx) => {
      const planRepository = new DrizzlePlanRepository(tx, this.scope.tenantId)
      const eventStore = new DrizzleDomainEventStore(tx, this.scope.tenantId)
      const enrollment = await requireEnrollment(tx, this.scope, this.input.enrollmentId)
      const plan = await planRepository.findById(enrollment.planId)
      if (!plan) {
        throw new Error('计划不存在')
      }

      const task = plan.getTaskSnapshot(this.input.taskId)
      if (!task) {
        throw new Error('任务不存在')
      }

      enrollment.submitCheckin(task, {
        fileIds: this.input.evidenceFileIds,
      }, this.input.completedAt ?? new Date(), this.input.remark)
      enrollment.recalculateEligibility(plan.getRequiredActiveTaskIds(), this.input.completedAt ?? new Date())

      await persistEnrollmentAndEvents(tx, this.scope, enrollment, eventStore)
      return enrollment.getCompletedTaskId(this.input.taskId)
    })
  }
}

export interface CompletePlanMetricTaskInput {
  enrollmentId: number
  taskId: number
  remark?: string | null
  completedAt?: Date
}

export class CompletePlanMetricTaskCommand {
  private readonly scope: TenantScope
  private readonly input: CompletePlanMetricTaskInput

  constructor(scope: TenantScope, input: CompletePlanMetricTaskInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<number | null> {
    return withTransaction(async (tx) => {
      const planRepository = new DrizzlePlanRepository(tx, this.scope.tenantId)
      const eventStore = new DrizzleDomainEventStore(tx, this.scope.tenantId)
      const enrollment = await requireEnrollment(tx, this.scope, this.input.enrollmentId)
      const plan = await planRepository.findById(enrollment.planId)
      if (!plan) {
        throw new Error('计划不存在')
      }

      const task = plan.getTaskSnapshot(this.input.taskId)
      if (!task) {
        throw new Error('任务不存在')
      }

      enrollment.completeMetricTask(task, this.input.remark, this.input.completedAt ?? new Date())
      enrollment.recalculateEligibility(plan.getRequiredActiveTaskIds(), this.input.completedAt ?? new Date())

      await persistEnrollmentAndEvents(tx, this.scope, enrollment, eventStore)
      return enrollment.getCompletedTaskId(this.input.taskId)
    })
  }
}

export interface GraduatePlanEnrollmentInput {
  enrollmentId: number
  graduatedAt?: Date
}

export class GraduatePlanEnrollmentCommand {
  private readonly scope: TenantScope
  private readonly input: GraduatePlanEnrollmentInput

  constructor(scope: TenantScope, input: GraduatePlanEnrollmentInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const enrollment = await requireEnrollment(tx, this.scope, this.input.enrollmentId)
      const eventStore = new DrizzleDomainEventStore(tx, this.scope.tenantId)

      enrollment.graduate(this.input.graduatedAt ?? new Date())
      await persistEnrollmentAndEvents(tx, this.scope, enrollment, eventStore)
    })

    return true
  }
}

export interface CancelPlanEnrollmentInput {
  enrollmentId: number
  cancelledAt?: Date
}

export class CancelPlanEnrollmentCommand {
  private readonly scope: TenantScope
  private readonly input: CancelPlanEnrollmentInput

  constructor(scope: TenantScope, input: CancelPlanEnrollmentInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const enrollment = await requireEnrollment(tx, this.scope, this.input.enrollmentId)
      const eventStore = new DrizzleDomainEventStore(tx, this.scope.tenantId)

      enrollment.cancel(this.input.cancelledAt ?? new Date())
      await persistEnrollmentAndEvents(tx, this.scope, enrollment, eventStore)
    })

    return true
  }
}

export interface RecalculatePlanEnrollmentProgressInput {
  enrollmentId: number
}

export class RecalculatePlanEnrollmentProgressCommand {
  private readonly scope: TenantScope
  private readonly input: RecalculatePlanEnrollmentProgressInput

  constructor(scope: TenantScope, input: RecalculatePlanEnrollmentProgressInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const enrollment = await requireEnrollment(tx, this.scope, this.input.enrollmentId)
      const plan = await new DrizzlePlanRepository(tx, this.scope.tenantId).findById(enrollment.planId)
      if (!plan) {
        throw new Error('计划不存在')
      }

      enrollment.recalculateEligibility(plan.getRequiredActiveTaskIds())
      await persistEnrollmentAndEvents(tx, this.scope, enrollment, new DrizzleDomainEventStore(tx, this.scope.tenantId))
    })

    return true
  }
}

export interface ProcessPlanTaskRewardsInput {
  tenantId?: number
  limit?: number
}

export class ProcessPlanTaskRewardsCommand {
  private readonly rewardPort: PlanRewardPort

  constructor(rewardPort: PlanRewardPort = new DomainPointPlanRewardPort()) {
    this.rewardPort = rewardPort
  }

  async execute(input: ProcessPlanTaskRewardsInput = {}): Promise<number> {
    const rows = await getDb()
      .select({ tenantId: planDomainEvents.tenantId, payload: planDomainEvents.payload })
      .from(planDomainEvents)
      .where(input.tenantId
        ? and(
            eq(planDomainEvents.tenantId, input.tenantId),
            eq(planDomainEvents.eventType, 'PlanTaskCompleted'),
          )
        : eq(planDomainEvents.eventType, 'PlanTaskCompleted'))
      .orderBy(asc(planDomainEvents.id))
      .limit(input.limit ?? 100)

    let processedCount = 0

    for (const row of rows) {
      const rewardEvent = toRewardEvent(row.payload)
      if (!rewardEvent) {
        continue
      }

      if (typeof row.tenantId === 'number') {
        await this.rewardPort.grantTaskReward({
          tenantId: row.tenantId,
          ...rewardEvent,
        })
        processedCount += 1
      }
    }

    return processedCount
  }
}
