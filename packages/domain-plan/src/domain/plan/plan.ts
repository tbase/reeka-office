import type { DomainEvent, PlanArchived, PlanPublished, PlanStructureChanged } from '../events'
import type { PlanStatus, PlanTaskType } from '../types'
import { AggregateRoot } from '../shared/aggregate-root'
import {
  ensureSameIds,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../shared/validation'
import { PlanStage, type PlanStageSnapshot } from './plan-stage'
import { PlanTask, type PlanTaskSnapshot } from './plan-task'

export interface PlanSnapshot {
  id: number | null
  name: string
  description: string | null
  status: PlanStatus
  createdBy: number
}

export interface AddPlanStageInput {
  title: string
  description?: string | null
  displayOrder?: number
}

export interface UpdatePlanStageInput {
  id: number
  title: string
  description?: string | null
}

export interface AddPlanTaskInput {
  stageId: number
  categoryId: number
  title: string
  description?: string | null
  displayOrder?: number
  taskType: PlanTaskType
  isRequired?: boolean
  pointItemId?: number | null
}

export interface UpdatePlanTaskInput {
  id: number
  stageId: number
  categoryId: number
  title: string
  description?: string | null
  displayOrder: number
  taskType: PlanTaskType
  isRequired: boolean
  pointItemId?: number | null
}

export class Plan extends AggregateRoot<PlanSnapshot, DomainEvent> {
  private readonly stages: PlanStage[]
  private readonly tasks: PlanTask[]

  private constructor(
    props: PlanSnapshot,
    stages: PlanStage[],
    tasks: PlanTask[],
  ) {
    super(props)
    this.stages = stages
    this.tasks = tasks
  }

  static create(input: { name: string; description?: string | null; createdBy: number }): Plan {
    return new Plan({
      id: null,
      name: normalizeRequiredText(input.name, '计划名称'),
      description: normalizeOptionalText(input.description),
      status: 'draft',
      createdBy: input.createdBy,
    }, [], [])
  }

  static restore(input: {
    root: PlanSnapshot
    stages: PlanStageSnapshot[]
    tasks: PlanTaskSnapshot[]
  }): Plan {
    return new Plan(
      input.root,
      input.stages.map((item) => PlanStage.restore(item)),
      input.tasks.map((item) => PlanTask.restore(item)),
    )
  }

  get status() {
    return this.props.status
  }

  get name() {
    return this.props.name
  }

  rename(name: string, description?: string | null) {
    this.props.name = normalizeRequiredText(name, '计划名称')
    this.props.description = normalizeOptionalText(description)
  }

  publish(now = new Date()) {
    if (this.props.status === 'published') {
      return
    }

    if (this.props.status === 'archived') {
      throw new Error('已归档的计划不能发布')
    }

    this.props.status = 'published'
    this.record({
      type: 'PlanPublished',
      planId: this.requireId('计划尚未持久化'),
      occurredAt: now,
    } satisfies PlanPublished)
  }

  archive(now = new Date()) {
    if (this.props.status === 'archived') {
      return
    }

    this.props.status = 'archived'
    this.record({
      type: 'PlanArchived',
      planId: this.requireId('计划尚未持久化'),
      occurredAt: now,
    } satisfies PlanArchived)
  }

  addStage(input: AddPlanStageInput): PlanStage {
    const stage = PlanStage.create({
      planId: this.requireId('计划尚未持久化'),
      title: input.title,
      description: input.description ?? null,
      displayOrder: input.displayOrder ?? this.stages.length,
    })

    this.stages.push(stage)
    this.emitStructureChanged()
    return stage
  }

  updateStage(input: UpdatePlanStageInput) {
    const stage = this.findStageOrThrow(input.id)
    stage.update({
      title: input.title,
      description: input.description ?? null,
    })
    this.emitStructureChanged()
  }

  removeStage(stageId: number) {
    if (this.tasks.some((task) => task.stageId === stageId)) {
      throw new Error('删除阶段前请先移除该阶段下的任务')
    }

    const nextStages = this.stages.filter((item) => item.id !== stageId)
    if (nextStages.length === this.stages.length) {
      throw new Error('阶段不存在')
    }

    this.stages.splice(0, this.stages.length, ...nextStages)
    this.emitStructureChanged()
  }

  reorderStages(stageIds: number[]) {
    const actualIds = this.stages.map((item) => item.id).filter((item): item is number => item !== null)
    ensureSameIds(actualIds, stageIds, '阶段')

    for (const [index, stageId] of stageIds.entries()) {
      this.findStageOrThrow(stageId).setDisplayOrder(index)
    }

    this.emitStructureChanged()
  }

  addTask(input: AddPlanTaskInput): PlanTask {
    this.findStageOrThrow(input.stageId)

    const stageTasks = this.tasks.filter((task) => task.stageId === input.stageId)
    const task = PlanTask.create({
      planId: this.requireId('计划尚未持久化'),
      stageId: input.stageId,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description ?? null,
      displayOrder: input.displayOrder ?? stageTasks.length,
      taskType: input.taskType,
      isRequired: input.isRequired ?? false,
      pointItemId: input.pointItemId ?? null,
    })

    this.tasks.push(task)
    this.emitStructureChanged()
    return task
  }

  updateTask(input: UpdatePlanTaskInput) {
    this.findStageOrThrow(input.stageId)

    const task = this.findTaskOrThrow(input.id)
    task.update({
      stageId: input.stageId,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description ?? null,
      displayOrder: input.displayOrder,
      taskType: input.taskType,
      isRequired: input.isRequired,
      pointItemId: input.pointItemId ?? null,
    })
    this.emitStructureChanged()
  }

  archiveTask(taskId: number) {
    const task = this.findTaskOrThrow(taskId)
    task.archive()
    this.emitStructureChanged()
  }

  reorderTasks(stageId: number, taskIds: number[]) {
    this.findStageOrThrow(stageId)

    const stageTaskIds = this.tasks
      .filter((task) => task.stageId === stageId)
      .map((task) => task.id)
      .filter((taskId): taskId is number => taskId !== null)

    ensureSameIds(stageTaskIds, taskIds, '任务')

    for (const [index, taskId] of taskIds.entries()) {
      this.findTaskOrThrow(taskId).setDisplayOrder(index)
    }

    this.emitStructureChanged()
  }

  getRequiredActiveTaskIds(): number[] {
    return this.tasks
      .filter((task) => task.status === 'active' && task.isRequired)
      .map((task) => task.id)
      .filter((taskId): taskId is number => taskId !== null)
  }

  getTaskSnapshot(taskId: number): PlanTaskSnapshot | null {
    return this.tasks.find((item) => item.id === taskId)?.toSnapshot() ?? null
  }

  toSnapshot() {
    return {
      root: { ...this.props },
      stages: this.stages.map((item) => item.toSnapshot()),
      tasks: this.tasks.map((item) => item.toSnapshot()),
    }
  }

  private emitStructureChanged(now = new Date()) {
    this.record({
      type: 'PlanStructureChanged',
      planId: this.requireId('计划尚未持久化'),
      occurredAt: now,
    } satisfies PlanStructureChanged)
  }

  private findStageOrThrow(stageId: number): PlanStage {
    const stage = this.stages.find((item) => item.id === stageId)
    if (!stage) {
      throw new Error('阶段不存在')
    }

    return stage
  }

  private findTaskOrThrow(taskId: number): PlanTask {
    const task = this.tasks.find((item) => item.id === taskId)
    if (!task) {
      throw new Error('任务不存在')
    }

    return task
  }
}

export function getPlanPersistenceState(plan: Plan): {
  stages: PlanStage[]
  tasks: PlanTask[]
} {
  const state = plan as unknown as {
    stages: PlanStage[]
    tasks: PlanTask[]
  }

  return {
    stages: [...state.stages],
    tasks: [...state.tasks],
  }
}
