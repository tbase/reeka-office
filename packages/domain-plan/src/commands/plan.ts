import { getDb, type DBExecutor, withTransaction } from '../context'
import type { DomainEventStore } from '../domain/ports'
import { Plan } from '../domain/plan/plan'
import { DrizzleDomainEventStore } from '../infrastructure/domain-event-store'
import { DrizzlePlanEnrollmentRepository } from '../infrastructure/plan-enrollment-repository'
import { DrizzlePlanRepository } from '../infrastructure/plan-repository'
import { DrizzlePlanTaskCategoryRepository } from '../infrastructure/plan-task-category-repository'

async function recalculatePlanEnrollments(
  db: DBExecutor,
  planId: number,
  eventStore: DomainEventStore,
) {
  const planRepository = new DrizzlePlanRepository(db)
  const enrollmentRepository = new DrizzlePlanEnrollmentRepository(db)
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

async function savePlanAndHandleEvents(db: DBExecutor, plan: Plan) {
  const planRepository = new DrizzlePlanRepository(db)
  const eventStore = new DrizzleDomainEventStore(db)

  await planRepository.save(plan)
  const events = plan.pullDomainEvents()
  await eventStore.append(events)

  if (events.some((event) => event.type === 'PlanStructureChanged')) {
    await recalculatePlanEnrollments(db, plan.id!, eventStore)
  }
}

async function requirePlan(db: DBExecutor, planId: number): Promise<Plan> {
  const repository = new DrizzlePlanRepository(db)
  const plan = await repository.findById(planId)
  if (!plan) {
    throw new Error('计划不存在')
  }

  return plan
}

async function ensureCategoryExists(db: DBExecutor, categoryId: number) {
  const repository = new DrizzlePlanTaskCategoryRepository(db)
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
  private readonly input: CreatePlanInput

  constructor(input: CreatePlanInput) {
    this.input = input
  }

  async execute(): Promise<number | null> {
    const db = getDb()
    const repository = new DrizzlePlanRepository(db)
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
  private readonly input: UpdatePlanInput

  constructor(input: UpdatePlanInput) {
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.id)
      plan.rename(this.input.name, this.input.description)
      await savePlanAndHandleEvents(tx, plan)
    })
    return true
  }
}

export interface PublishPlanInput {
  id: number
}

export class PublishPlanCommand {
  private readonly input: PublishPlanInput

  constructor(input: PublishPlanInput) {
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.id)
      plan.publish()
      await savePlanAndHandleEvents(tx, plan)
    })
    return true
  }
}

export interface ArchivePlanInput {
  id: number
}

export class ArchivePlanCommand {
  private readonly input: ArchivePlanInput

  constructor(input: ArchivePlanInput) {
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.id)
      plan.archive()
      await savePlanAndHandleEvents(tx, plan)
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

export interface CreatePlanStagesBatchInput {
  planId: number
  titles: string[]
}

export class CreatePlanStageCommand {
  private readonly input: CreatePlanStageInput

  constructor(input: CreatePlanStageInput) {
    this.input = input
  }

  async execute(): Promise<number | null> {
    return withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.planId)
      const stage = plan.addStage(this.input)
      await savePlanAndHandleEvents(tx, plan)
      return stage.id
    })
  }
}

export class CreatePlanStagesBatchCommand {
  private readonly input: CreatePlanStagesBatchInput

  constructor(input: CreatePlanStagesBatchInput) {
    this.input = input
  }

  async execute(): Promise<number[]> {
    return withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.planId)

      for (const title of this.input.titles) {
        plan.addStage({
          title,
          description: null,
        })
      }

      await savePlanAndHandleEvents(tx, plan)

      return plan
        .toSnapshot()
        .stages.slice(-this.input.titles.length)
        .map((stage) => {
          if (!stage.id) {
            throw new Error('创建计划阶段失败')
          }

          return stage.id
        })
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
  private readonly input: UpdatePlanStageInput

  constructor(input: UpdatePlanStageInput) {
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.planId)
      plan.updateStage({
        id: this.input.id,
        title: this.input.title,
        description: this.input.description,
      })
      await savePlanAndHandleEvents(tx, plan)
    })
    return true
  }
}

export interface DeletePlanStageInput {
  id: number
  planId: number
}

export class DeletePlanStageCommand {
  private readonly input: DeletePlanStageInput

  constructor(input: DeletePlanStageInput) {
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.planId)
      plan.removeStage(this.input.id)
      await savePlanAndHandleEvents(tx, plan)
    })
    return true
  }
}

export interface ReorderPlanStagesInput {
  planId: number
  orderedStageIds: number[]
}

export class ReorderPlanStagesCommand {
  private readonly input: ReorderPlanStagesInput

  constructor(input: ReorderPlanStagesInput) {
    this.input = input
  }

  async execute(): Promise<number> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.planId)
      plan.reorderStages(this.input.orderedStageIds)
      await savePlanAndHandleEvents(tx, plan)
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
  private readonly input: CreatePlanTaskInput

  constructor(input: CreatePlanTaskInput) {
    this.input = input
  }

  async execute(): Promise<number | null> {
    return withTransaction(async (tx) => {
      await ensureCategoryExists(tx, this.input.categoryId)

      const plan = await requirePlan(tx, this.input.planId)
      const task = plan.addTask(this.input)
      await savePlanAndHandleEvents(tx, plan)
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
  private readonly input: UpdatePlanTaskInput

  constructor(input: UpdatePlanTaskInput) {
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      await ensureCategoryExists(tx, this.input.categoryId)

      const plan = await requirePlan(tx, this.input.planId)
      plan.updateTask(this.input)
      await savePlanAndHandleEvents(tx, plan)
    })
    return true
  }
}

export interface ArchivePlanTaskInput {
  id: number
  planId: number
}

export class ArchivePlanTaskCommand {
  private readonly input: ArchivePlanTaskInput

  constructor(input: ArchivePlanTaskInput) {
    this.input = input
  }

  async execute(): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.planId)
      plan.archiveTask(this.input.id)
      await savePlanAndHandleEvents(tx, plan)
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
  private readonly input: ReorderPlanTasksInput

  constructor(input: ReorderPlanTasksInput) {
    this.input = input
  }

  async execute(): Promise<number> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, this.input.planId)
      plan.reorderTasks(this.input.stageId, this.input.orderedTaskIds)
      await savePlanAndHandleEvents(tx, plan)
    })
    return this.input.orderedTaskIds.length
  }
}
