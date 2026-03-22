import { getDb, withTransaction } from '../context'
import { PlanTaskCategory } from '../domain/task-category/plan-task-category'
import { DrizzlePlanTaskCategoryRepository } from '../infrastructure/plan-task-category-repository'
import { planTaskCategories } from '../schema'

export interface CreatePlanTaskCategoryInput {
  name: string
  description?: string | null
  displayOrder?: number
}

export interface CreatePlanTaskCategoriesBatchInput {
  names: string[]
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

export class CreatePlanTaskCategoriesBatchCommand {
  private readonly input: CreatePlanTaskCategoriesBatchInput

  constructor(input: CreatePlanTaskCategoriesBatchInput) {
    this.input = input
  }

  async execute(): Promise<number[]> {
    return withTransaction(async (tx) => {
      const repository = new DrizzlePlanTaskCategoryRepository(tx)
      const createdIds: number[] = []
      const pendingNames = new Set<string>()
      const existingCategories = await tx.select().from(planTaskCategories)
      let nextDisplayOrder =
        existingCategories.reduce(
          (maxDisplayOrder, category) => Math.max(maxDisplayOrder, category.displayOrder),
          -1,
        ) + 1

      for (const rawName of this.input.names) {
        const name = rawName.trim()
        if (pendingNames.has(name) || (await repository.findByName(name))) {
          throw new Error('任务分类已存在')
        }

        pendingNames.add(name)

        const category = PlanTaskCategory.create({
          name,
          description: null,
          displayOrder: nextDisplayOrder,
        })

        await repository.save(category)
        if (!category.id) {
          throw new Error('创建计划任务分类失败')
        }

        createdIds.push(category.id)
        nextDisplayOrder += 1
      }

      return createdIds
    })
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
