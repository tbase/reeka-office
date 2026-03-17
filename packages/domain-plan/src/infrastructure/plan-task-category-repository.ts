import { and, eq } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import type { PlanTaskCategoryRepository } from '../domain/repositories'
import { PlanTaskCategory } from '../domain/task-category/plan-task-category'
import {
  planTaskCategories,
  planTasks,
  type NewPlanTaskCategoryRow,
} from '../schema'

export class DrizzlePlanTaskCategoryRepository implements PlanTaskCategoryRepository {
  constructor(private readonly db: DBExecutor) {}

  async findById(categoryId: number): Promise<PlanTaskCategory | null> {
    const [row] = await this.db
      .select()
      .from(planTaskCategories)
      .where(eq(planTaskCategories.id, categoryId))
      .limit(1)

    if (!row) {
      return null
    }

    return PlanTaskCategory.restore({
      id: row.id,
      name: row.name,
      description: row.description,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
    })
  }

  async findByName(name: string): Promise<PlanTaskCategory | null> {
    const [row] = await this.db
      .select()
      .from(planTaskCategories)
      .where(eq(planTaskCategories.name, name.trim()))
      .limit(1)

    if (!row) {
      return null
    }

    return PlanTaskCategory.restore({
      id: row.id,
      name: row.name,
      description: row.description,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
    })
  }

  async listActive(): Promise<PlanTaskCategory[]> {
    const rows = await this.db
      .select()
      .from(planTaskCategories)
      .where(eq(planTaskCategories.isActive, true))

    return rows.map((row) => PlanTaskCategory.restore({
      id: row.id,
      name: row.name,
      description: row.description,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
    }))
  }

  async save(category: PlanTaskCategory): Promise<void> {
    const snapshot = category.toSnapshot()

    if (!snapshot.id) {
      const values: NewPlanTaskCategoryRow = {
        name: snapshot.name,
        description: snapshot.description,
        displayOrder: snapshot.displayOrder,
        isActive: snapshot.isActive,
      }

      const result = await this.db.insert(planTaskCategories).values(values).$returningId()
      const categoryId = result[0]?.id
      if (!categoryId) {
        throw new Error('创建计划任务分类失败')
      }

      category.assignId(categoryId)
      return
    }

    await this.db
      .update(planTaskCategories)
      .set({
        name: snapshot.name,
        description: snapshot.description,
        displayOrder: snapshot.displayOrder,
        isActive: snapshot.isActive,
      })
      .where(eq(planTaskCategories.id, snapshot.id))
  }

  async remove(categoryId: number): Promise<void> {
    await this.db.delete(planTaskCategories).where(eq(planTaskCategories.id, categoryId))
  }

  async isInUse(categoryId: number): Promise<boolean> {
    const rows = await this.db
      .select({ id: planTasks.id })
      .from(planTasks)
      .where(eq(planTasks.categoryId, categoryId))
      .limit(1)

    return Boolean(rows[0]?.id)
  }
}
