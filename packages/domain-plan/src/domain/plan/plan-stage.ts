import {
  ensureNonNegativeInteger,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../shared/validation'

export interface PlanStageSnapshot {
  id: number | null
  planId: number
  title: string
  description: string | null
  displayOrder: number
}

export class PlanStage {
  private props: PlanStageSnapshot

  private constructor(props: PlanStageSnapshot) {
    this.props = props
  }

  static create(input: Omit<PlanStageSnapshot, 'id'>): PlanStage {
    return new PlanStage({
      id: null,
      planId: input.planId,
      title: normalizeRequiredText(input.title, '阶段标题'),
      description: normalizeOptionalText(input.description),
      displayOrder: ensureNonNegativeInteger(input.displayOrder, '阶段排序'),
    })
  }

  static restore(snapshot: PlanStageSnapshot): PlanStage {
    return new PlanStage(snapshot)
  }

  get id() {
    return this.props.id
  }

  get planId() {
    return this.props.planId
  }

  get title() {
    return this.props.title
  }

  get displayOrder() {
    return this.props.displayOrder
  }

  update(input: Pick<PlanStageSnapshot, 'title' | 'description'>) {
    this.props.title = normalizeRequiredText(input.title, '阶段标题')
    this.props.description = normalizeOptionalText(input.description)
  }

  setDisplayOrder(displayOrder: number) {
    this.props.displayOrder = ensureNonNegativeInteger(displayOrder, '阶段排序')
  }

  assignId(id: number) {
    this.props.id = id
  }

  toSnapshot(): PlanStageSnapshot {
    return { ...this.props }
  }
}
