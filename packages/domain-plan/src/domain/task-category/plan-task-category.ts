import {
  ensureNonNegativeInteger,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../shared/validation'

export interface PlanTaskCategorySnapshot {
  id: number | null
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

export class PlanTaskCategory {
  private props: PlanTaskCategorySnapshot

  private constructor(props: PlanTaskCategorySnapshot) {
    this.props = props
  }

  static create(input: Omit<PlanTaskCategorySnapshot, 'id' | 'isActive'> & { isActive?: boolean }): PlanTaskCategory {
    return new PlanTaskCategory({
      id: null,
      name: normalizeRequiredText(input.name, '任务分类名称'),
      description: normalizeOptionalText(input.description),
      displayOrder: ensureNonNegativeInteger(input.displayOrder, '任务分类排序'),
      isActive: input.isActive ?? true,
    })
  }

  static restore(snapshot: PlanTaskCategorySnapshot): PlanTaskCategory {
    return new PlanTaskCategory(snapshot)
  }

  get id() {
    return this.props.id
  }

  get name() {
    return this.props.name
  }

  get isActive() {
    return this.props.isActive
  }

  rename(input: Pick<PlanTaskCategorySnapshot, 'name' | 'description' | 'displayOrder'>) {
    this.props.name = normalizeRequiredText(input.name, '任务分类名称')
    this.props.description = normalizeOptionalText(input.description)
    this.props.displayOrder = ensureNonNegativeInteger(input.displayOrder, '任务分类排序')
  }

  disable() {
    this.props.isActive = false
  }

  assignId(id: number) {
    this.props.id = id
  }

  toSnapshot(): PlanTaskCategorySnapshot {
    return { ...this.props }
  }
}
