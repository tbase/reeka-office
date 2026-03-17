import { getDb, type DBExecutor, withTransaction } from '../context'
import type { DomainEventStore } from '../domain/ports'
import { Plan } from '../domain/plan/plan'
import { DrizzleDomainEventStore } from '../infrastructure/domain-event-store'
import { DrizzlePlanEnrollmentRepository } from '../infrastructure/plan-enrollment-repository'
import { DrizzlePlanRepository } from '../infrastructure/plan-repository'
import { DrizzlePlanTaskCategoryRepository } from '../infrastructure/plan-task-category-repository'
import type { TenantScope } from '../scope'

async function recalculatePlanEnrollments(
  db: DBExecutor,
  scope: TenantScope,
  planId: number,
  eventStore: DomainEventStore,
) {
  const planRepository = new DrizzlePlanRepository(db, scope.tenantId)
  const enrollmentRepository = new DrizzlePlanEnrollmentRepository(db, scope.tenantId)
  const plan = await planRepository.findById(planId)
  if (!plan) {
    return
  }

  const requiredTaskIds = plan.getRequiredActiveTaskIds()
  const enrollments = await enrollmentRepository.listRecalculableByPlan(planId)
  for (const enrollment of enrollments) {
    enrollment.recalculateEligibility(requiredTaskIds)
    await enrollmentRepository.save(enrollment)

    const assignedEvent = enrollment.pullAssignedEvent()
    const completionEvents = enrollment.pullCompletedTaskEvents()
    const otherEvents = enrollment.pullDomainEvents()
    await eventStore.append([
      ...(assignedEvent ? [assignedEvent] : []),
      ...completionEvents,
      ...otherEvents,
    ])
  }
}

async function savePlanAndHandleEvents(db: DBExecutor, scope: TenantScope, plan: Plan) {
  const planRepository = new DrizzlePlanRepository(db, scope.tenantId)
  const eventStore = new DrizzleDomainEventStore(db, scope.tenantId)

  await planRepository.save(plan)
  const events = plan.pullDomainEvents()
  await eventStore.append(events)

  if (events.some((event) => event.type === 'PlanStructureChanged')) {
    await recalculatePlanEnrollments(db, scope, plan.id!, eventStore)
  }
}

async function requirePlan(db: DBExecutor, scope: TenantScope, planId: number): Promise<Plan> {
  const repository = new DrizzlePlanRepository(db, scope.tenantId)
  const plan = await repository.findById(planId)
  if (!plan) {
    throw new Error('计划不存在')
  }

  return plan
}

async function ensureCategoryExists(db: DBExecutor, scope: TenantScope, categoryId: number) {
  const repository = new DrizzlePlanTaskCategoryRepository(db, scope.tenantId)
  const category = await repository.findById(categoryId)
  if (!category || !category.isActive) {
    throw new Error('任务分类不存在')
  }
}

export interface CreatePlanInput {
  name: string
  description?: string | null
  createdBy: number
}

export class CreatePlanCommand {
  private readonly scope: TenantScope
  private readonly input: CreatePlanInput

  constructor(scope: TenantScope, input: CreatePlanInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<number | null> {
    const db = getDb()
    const repository = new DrizzlePlanRepository(db, this.scope.tenantId)
    if (await repository.existsByName(this.input.name)) {
      throw new Error('计划名称已存在')
    }

    const plan = Plan.create(this.input)
    await repository.save(plan)
    return plan.id
  }
}

export interface UpdatePlanInput {
  id: number
  name: string
  description?: string | null
}

export class UpdatePlanCommand {
  private readonly scope: TenantScope
  private readonly input: UpdatePlanInput

  constructor(scope: TenantScope, input: UpdatePlanInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.scope, this.input.id)
      plan.rename(this.input.name, this.input.description)
      await savePlanAndHandleEvents(tx, this.scope, plan)
    })
    return true
  }
}

export interface PublishPlanInput {
  id: number
}

export class PublishPlanCommand {
  private readonly scope: TenantScope
  private readonly input: PublishPlanInput

  constructor(scope: TenantScope, input: PublishPlanInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.scope, this.input.id)
      plan.publish()
      await savePlanAndHandleEvents(tx, this.scope, plan)
    })
    return true
  }
}

export interface ArchivePlanInput {
  id: number
}

export class ArchivePlanCommand {
  private readonly scope: TenantScope
  private readonly input: ArchivePlanInput

  constructor(scope: TenantScope, input: ArchivePlanInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.scope, this.input.id)
      plan.archive()
      await savePlanAndHandleEvents(tx, this.scope, plan)
    })
    return true
  }
}

export interface CreatePlanStageInput {
  planId: number
  title: string
  description?: string | null
  displayOrder?: number
}

export class CreatePlanStageCommand {
  private readonly scope: TenantScope
  private readonly input: CreatePlanStageInput

  constructor(scope: TenantScope, input: CreatePlanStageInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<number | null> {
    return withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.scope, this.input.planId)
      const stage = plan.addStage(this.input)
      await savePlanAndHandleEvents(tx, this.scope, plan)
      return stage.id
    })
  }
}

export interface UpdatePlanStageInput {
  id: number
  planId: number
  title: string
  description?: string | null
}

export class UpdatePlanStageCommand {
  private readonly scope: TenantScope
  private readonly input: UpdatePlanStageInput

  constructor(scope: TenantScope, input: UpdatePlanStageInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.scope, this.input.planId)
      plan.updateStage({
        id: this.input.id,
        title: this.input.title,
        description: this.input.description,
      })
      await savePlanAndHandleEvents(tx, this.scope, plan)
    })
    return true
  }
}

export interface DeletePlanStageInput {
  id: number
  planId: number
}

export class DeletePlanStageCommand {
  private readonly scope: TenantScope
  private readonly input: DeletePlanStageInput

  constructor(scope: TenantScope, input: DeletePlanStageInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.scope, this.input.planId)
      plan.removeStage(this.input.id)
      await savePlanAndHandleEvents(tx, this.scope, plan)
    })
    return true
  }
}

export interface ReorderPlanStagesInput {
  planId: number
  orderedStageIds: number[]
}

export class ReorderPlanStagesCommand {
  private readonly scope: TenantScope
  private readonly input: ReorderPlanStagesInput

  constructor(scope: TenantScope, input: ReorderPlanStagesInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<number> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.scope, this.input.planId)
      plan.reorderStages(this.input.orderedStageIds)
      await savePlanAndHandleEvents(tx, this.scope, plan)
    })
    return this.input.orderedStageIds.length
  }
}

export interface CreatePlanTaskInput {
  planId: number
  stageId: number
  categoryId: number
  title: string
  description?: string | null
  displayOrder?: number
  taskType: 'normal' | 'metric'
  isRequired?: boolean
  pointItemId?: number | null
}

export class CreatePlanTaskCommand {
  private readonly scope: TenantScope
  private readonly input: CreatePlanTaskInput

  constructor(scope: TenantScope, input: CreatePlanTaskInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<number | null> {
    return withTransaction(async (tx) => {
      await ensureCategoryExists(tx, this.scope, this.input.categoryId)

      const plan = await requirePlan(tx, this.scope, this.input.planId)
      const task = plan.addTask(this.input)
      await savePlanAndHandleEvents(tx, this.scope, plan)
      return task.id
    })
  }
}

export interface UpdatePlanTaskInput {
  id: number
  planId: number
  stageId: number
  categoryId: number
  title: string
  description?: string | null
  displayOrder: number
  taskType: 'normal' | 'metric'
  isRequired: boolean
  pointItemId?: number | null
}

export class UpdatePlanTaskCommand {
  private readonly scope: TenantScope
  private readonly input: UpdatePlanTaskInput

  constructor(scope: TenantScope, input: UpdatePlanTaskInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      await ensureCategoryExists(tx, this.scope, this.input.categoryId)

      const plan = await requirePlan(tx, this.scope, this.input.planId)
      plan.updateTask(this.input)
      await savePlanAndHandleEvents(tx, this.scope, plan)
    })
    return true
  }
}

export interface ArchivePlanTaskInput {
  id: number
  planId: number
}

export class ArchivePlanTaskCommand {
  private readonly scope: TenantScope
  private readonly input: ArchivePlanTaskInput

  constructor(scope: TenantScope, input: ArchivePlanTaskInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.scope, this.input.planId)
      plan.archiveTask(this.input.id)
      await savePlanAndHandleEvents(tx, this.scope, plan)
    })
    return true
  }
}

export interface ReorderPlanTasksInput {
  planId: number
  stageId: number
  orderedTaskIds: number[]
}

export class ReorderPlanTasksCommand {
  private readonly scope: TenantScope
  private readonly input: ReorderPlanTasksInput

  constructor(scope: TenantScope, input: ReorderPlanTasksInput) {
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<number> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.scope, this.input.planId)
      plan.reorderTasks(this.input.stageId, this.input.orderedTaskIds)
      await savePlanAndHandleEvents(tx, this.scope, plan)
    })
    return this.input.orderedTaskIds.length
  }
}
