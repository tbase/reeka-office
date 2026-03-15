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
  async execute(input: CreatePlanInput): Promise<number | null> {
    const db = getDb()
    const repository = new DrizzlePlanRepository(db)
    if (await repository.existsByName(input.name)) {
      throw new Error('计划名称已存在')
    }

    const plan = Plan.create(input)
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
  async execute(input: UpdatePlanInput): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, input.id)
      plan.rename(input.name, input.description)
      await savePlanAndHandleEvents(tx, plan)
    })
    return true
  }
}

export interface PublishPlanInput {
  id: number
}

export class PublishPlanCommand {
  async execute(input: PublishPlanInput): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, input.id)
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
  async execute(input: ArchivePlanInput): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, input.id)
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

export class CreatePlanStageCommand {
  async execute(input: CreatePlanStageInput): Promise<number | null> {
    return withTransaction(async (tx) => {
      const plan = await requirePlan(tx, input.planId)
      const stage = plan.addStage(input)
      await savePlanAndHandleEvents(tx, plan)
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
  async execute(input: UpdatePlanStageInput): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, input.planId)
      plan.updateStage({
        id: input.id,
        title: input.title,
        description: input.description,
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
  async execute(input: DeletePlanStageInput): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, input.planId)
      plan.removeStage(input.id)
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
  async execute(input: ReorderPlanStagesInput): Promise<number> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, input.planId)
      plan.reorderStages(input.orderedStageIds)
      await savePlanAndHandleEvents(tx, plan)
    })
    return input.orderedStageIds.length
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
  async execute(input: CreatePlanTaskInput): Promise<number | null> {
    return withTransaction(async (tx) => {
      await ensureCategoryExists(tx, input.categoryId)

      const plan = await requirePlan(tx, input.planId)
      const task = plan.addTask(input)
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
  async execute(input: UpdatePlanTaskInput): Promise<boolean> {
    await withTransaction(async (tx) => {
      await ensureCategoryExists(tx, input.categoryId)

      const plan = await requirePlan(tx, input.planId)
      plan.updateTask(input)
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
  async execute(input: ArchivePlanTaskInput): Promise<boolean> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, input.planId)
      plan.archiveTask(input.id)
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
  async execute(input: ReorderPlanTasksInput): Promise<number> {
    await withTransaction(async (tx) => {
      const plan = await requirePlan(tx, input.planId)
      plan.reorderTasks(input.stageId, input.orderedTaskIds)
      await savePlanAndHandleEvents(tx, plan)
    })
    return input.orderedTaskIds.length
  }
}
