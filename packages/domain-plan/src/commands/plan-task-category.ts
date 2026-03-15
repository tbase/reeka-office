import { getDb } from '../context'
import { PlanTaskCategory } from '../domain/task-category/plan-task-category'
import { DrizzlePlanTaskCategoryRepository } from '../infrastructure/plan-task-category-repository'

export interface CreatePlanTaskCategoryInput {
  name: string
  description?: string | null
  displayOrder?: number
}

export class CreatePlanTaskCategoryCommand {
  async execute(input: CreatePlanTaskCategoryInput): Promise<number | null> {
    const repository = new DrizzlePlanTaskCategoryRepository(getDb())
    if (await repository.findByName(input.name)) {
      throw new Error('任务分类已存在')
    }

    const category = PlanTaskCategory.create({
      name: input.name,
      description: input.description ?? null,
      displayOrder: input.displayOrder ?? 0,
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
  async execute(input: UpdatePlanTaskCategoryInput): Promise<boolean> {
    const repository = new DrizzlePlanTaskCategoryRepository(getDb())
    const category = await repository.findById(input.id)
    if (!category) {
      throw new Error('任务分类不存在')
    }

    const duplicated = await repository.findByName(input.name)
    if (duplicated && duplicated.id !== input.id) {
      throw new Error('任务分类已存在')
    }

    category.rename({
      name: input.name,
      description: input.description ?? null,
      displayOrder: input.displayOrder,
    })

    await repository.save(category)
    return true
  }
}

export interface DisablePlanTaskCategoryInput {
  id: number
}

export class DisablePlanTaskCategoryCommand {
  async execute(input: DisablePlanTaskCategoryInput): Promise<boolean> {
    const repository = new DrizzlePlanTaskCategoryRepository(getDb())
    const category = await repository.findById(input.id)
    if (!category) {
      throw new Error('任务分类不存在')
    }

    if (await repository.isInUse(input.id)) {
      category.disable()
      await repository.save(category)
      return true
    }

    await repository.remove(input.id)
    return true
  }
}
