import type { PlanTaskStatus, PlanTaskType } from '../types'
import {
  ensureNonNegativeInteger,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../shared/validation'

export interface PlanTaskSnapshot {
  id: number | null
  planId: number
  stageId: number
  categoryId: number
  title: string
  description: string | null
  displayOrder: number
  taskType: PlanTaskType
  isRequired: boolean
  status: PlanTaskStatus
  pointItemId: number | null
}

function normalizeTaskStatus(status: PlanTaskStatus): PlanTaskStatus {
  if (status !== 'active' && status !== 'archived') {
    throw new Error('任务状态无效')
  }

  return status
}

export class PlanTask {
  private props: PlanTaskSnapshot

  private constructor(props: PlanTaskSnapshot) {
    this.props = props
  }

  static create(input: Omit<PlanTaskSnapshot, 'id' | 'status'> & { status?: PlanTaskStatus }): PlanTask {
    return new PlanTask({
      id: null,
      planId: input.planId,
      stageId: input.stageId,
      categoryId: input.categoryId,
      title: normalizeRequiredText(input.title, '任务标题'),
      description: normalizeOptionalText(input.description),
      displayOrder: ensureNonNegativeInteger(input.displayOrder, '任务排序'),
      taskType: input.taskType,
      isRequired: input.taskType === 'metric' ? true : input.isRequired,
      status: normalizeTaskStatus(input.status ?? 'active'),
      pointItemId: input.pointItemId ?? null,
    })
  }

  static restore(snapshot: PlanTaskSnapshot): PlanTask {
    return new PlanTask(snapshot)
  }

  get id() {
    return this.props.id
  }

  get planId() {
    return this.props.planId
  }

  get stageId() {
    return this.props.stageId
  }

  get taskType() {
    return this.props.taskType
  }

  get isRequired() {
    return this.props.isRequired
  }

  get status() {
    return this.props.status
  }

  get pointItemId() {
    return this.props.pointItemId
  }

  update(input: Omit<PlanTaskSnapshot, 'id' | 'planId' | 'status'> & { status?: PlanTaskStatus }) {
    this.props.stageId = input.stageId
    this.props.categoryId = input.categoryId
    this.props.title = normalizeRequiredText(input.title, '任务标题')
    this.props.description = normalizeOptionalText(input.description)
    this.props.displayOrder = ensureNonNegativeInteger(input.displayOrder, '任务排序')
    this.props.taskType = input.taskType
    this.props.isRequired = input.taskType === 'metric' ? true : input.isRequired
    this.props.status = normalizeTaskStatus(input.status ?? this.props.status)
    this.props.pointItemId = input.pointItemId ?? null
  }

  archive() {
    this.props.status = 'archived'
  }

  setDisplayOrder(displayOrder: number) {
    this.props.displayOrder = ensureNonNegativeInteger(displayOrder, '任务排序')
  }

  assignId(id: number) {
    this.props.id = id
  }

  toSnapshot(): PlanTaskSnapshot {
    return { ...this.props }
  }
}
