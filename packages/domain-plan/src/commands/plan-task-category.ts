import { getDb } from '../context'
import { PlanTaskCategory } from '../domain/task-category/plan-task-category'
import { DrizzlePlanTaskCategoryRepository } from '../infrastructure/plan-task-category-repository'

export interface CreatePlanTaskCategoryInput {
  name: string
  description?: string | null
  displayOrder?: number
}

export class CreatePlanTaskCategoryCommand {
  private readonly input: CreatePlanTaskCategoryInput

  constructor(input: CreatePlanTaskCategoryInput) {
    this.input = input
  }

  async execute(): Promise<number | null> {
    const repository = new DrizzlePlanTaskCategoryRepository(getDb())
    if (await repository.findByName(this.input.name)) {
      throw new Error('任务分类已存在')
    }

    const category = PlanTaskCategory.create({
      name: this.input.name,
      description: this.input.description ?? null,
      displayOrder: this.input.displayOrder ?? 0,
    })

    await repository.save(category)
    return category.id
  }
}

export interface UpdatePlanTaskCategoryInput {
  id: number
  name: string
  description?: string | null
  displayOrder: number
}

export class UpdatePlanTaskCategoryCommand {
  private readonly input: UpdatePlanTaskCategoryInput

  constructor(input: UpdatePlanTaskCategoryInput) {
    this.input = input
  }

  async execute(): Promise<boolean> {
    const repository = new DrizzlePlanTaskCategoryRepository(getDb())
    const category = await repository.findById(this.input.id)
    if (!category) {
      throw new Error('任务分类不存在')
    }

    const duplicated = await repository.findByName(this.input.name)
    if (duplicated && duplicated.id !== this.input.id) {
      throw new Error('任务分类已存在')
    }

    category.rename({
      name: this.input.name,
      description: this.input.description ?? null,
      displayOrder: this.input.displayOrder,
    })

    await repository.save(category)
    return true
  }
}

export interface DisablePlanTaskCategoryInput {
  id: number
}

export class DisablePlanTaskCategoryCommand {
  private readonly input: DisablePlanTaskCategoryInput

  constructor(input: DisablePlanTaskCategoryInput) {
    this.input = input
  }

  async execute(): Promise<boolean> {
    const repository = new DrizzlePlanTaskCategoryRepository(getDb())
    const category = await repository.findById(this.input.id)
    if (!category) {
      throw new Error('任务分类不存在')
    }

    if (await repository.isInUse(this.input.id)) {
      category.disable()
      await repository.save(category)
      return true
    }

    await repository.remove(this.input.id)
    return true
  }
}
