import { and, eq, ne } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import {
  newbieTaskCategories,
  newbieTasks,
  type NewNewbieTaskCategoryRow,
} from '../schema'

export interface CreateNewbieTaskCategoryInput {
  name: string
}

export class CreateNewbieTaskCategoryCommand {
  private readonly db: DB

  constructor(private readonly input: CreateNewbieTaskCategoryInput) {
    this.db = getDb()
  }

  async execute(): Promise<number | null> {
    const name = this.input.name.trim()
    if (!name) {
      throw new Error('任务分类不能为空')
    }

    const duplicated = await this.db
      .select({ id: newbieTaskCategories.id })
      .from(newbieTaskCategories)
      .where(eq(newbieTaskCategories.name, name))
      .limit(1)

    if (duplicated[0]?.id) {
      throw new Error('任务分类已存在')
    }

    const values: NewNewbieTaskCategoryRow = { name }
    const result = await this.db.insert(newbieTaskCategories).values(values).$returningId()
    return result[0]?.id ?? null
  }
}

export interface UpdateNewbieTaskCategoryInput {
  id: number
  name: string
}

export class UpdateNewbieTaskCategoryCommand {
  private readonly db: DB

  constructor(private readonly input: UpdateNewbieTaskCategoryInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const name = this.input.name.trim()
    if (!name) {
      throw new Error('任务分类不能为空')
    }

    const duplicated = await this.db
      .select({ id: newbieTaskCategories.id })
      .from(newbieTaskCategories)
      .where(and(eq(newbieTaskCategories.name, name), ne(newbieTaskCategories.id, this.input.id)))
      .limit(1)

    if (duplicated[0]?.id) {
      throw new Error('任务分类已存在')
    }

    const [result] = await this.db
      .update(newbieTaskCategories)
      .set({ name })
      .where(eq(newbieTaskCategories.id, this.input.id))

    return result.affectedRows > 0
  }
}

export interface DeleteNewbieTaskCategoryInput {
  id: number
}

export class DeleteNewbieTaskCategoryCommand {
  private readonly db: DB

  constructor(private readonly input: DeleteNewbieTaskCategoryInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const linkedTask = await this.db
      .select({ id: newbieTasks.id })
      .from(newbieTasks)
      .where(eq(newbieTasks.categoryId, this.input.id))
      .limit(1)

    if (linkedTask[0]?.id) {
      throw new Error('删除失败，请先移除该分类下的任务')
    }

    const [result] = await this.db
      .delete(newbieTaskCategories)
      .where(eq(newbieTaskCategories.id, this.input.id))

    return result.affectedRows > 0
  }
}
