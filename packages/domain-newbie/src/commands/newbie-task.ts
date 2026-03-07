import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import {
  newbieTaskCategories,
  newbieTasks,
  type NewNewbieTaskCategoryRow,
  type NewNewbieTaskRow,
} from '../schema'

interface NewbieTaskMutationInput {
  title: string
  description?: string | null
  stageId: number
  categoryName: string
  displayOrder?: number
  pointEventId: number
  pointAmount?: number | null
}

function normalizeTaskCategoryName(name: string): string {
  const categoryName = name.trim()
  if (!categoryName) {
    throw new Error('任务分类不能为空')
  }

  return categoryName
}

async function getOrCreateTaskCategoryId(db: DB, name: string): Promise<number> {
  const categoryName = normalizeTaskCategoryName(name)

  const rows = await db
    .select({ id: newbieTaskCategories.id })
    .from(newbieTaskCategories)
    .where(eq(newbieTaskCategories.name, categoryName))
    .limit(1)

  const existedId = rows[0]?.id
  if (existedId) {
    return existedId
  }

  const values: NewNewbieTaskCategoryRow = {
    name: categoryName,
  }

  const created = await db.insert(newbieTaskCategories).values(values).$returningId()
  const createdId = created[0]?.id
  if (!createdId) {
    throw new Error('创建任务分类失败')
  }

  return createdId
}

function buildTaskRow(input: NewbieTaskMutationInput, categoryId: number): NewNewbieTaskRow {
  return {
    title: input.title,
    description: input.description ?? null,
    stageId: input.stageId,
    categoryId,
    displayOrder: input.displayOrder ?? 0,
    pointEventId: input.pointEventId,
    pointAmount: input.pointAmount ?? null,
  }
}

function validateTaskOrder(stageTaskIds: number[], orderedTaskIds: number[]): void {
  if (stageTaskIds.length !== orderedTaskIds.length) {
    throw new Error('任务顺序数据不完整，请刷新后重试')
  }

  const orderedTaskIdSet = new Set(orderedTaskIds)
  if (orderedTaskIdSet.size !== orderedTaskIds.length) {
    throw new Error('任务顺序包含重复任务，请刷新后重试')
  }

  const stageTaskIdSet = new Set(stageTaskIds)
  for (const taskId of orderedTaskIds) {
    if (!stageTaskIdSet.has(taskId)) {
      throw new Error('任务顺序包含无效任务，请刷新后重试')
    }
  }
}

export interface CreateNewbieTaskInput extends NewbieTaskMutationInput {}

export class CreateNewbieTaskCommand {
  private readonly db: DB

  constructor(private readonly input: CreateNewbieTaskInput) {
    this.db = getDb()
  }

  async execute(): Promise<number | null> {
    const categoryId = await getOrCreateTaskCategoryId(this.db, this.input.categoryName)
    const values = buildTaskRow(this.input, categoryId)

    const result = await this.db.insert(newbieTasks).values(values).$returningId()
    return result[0]?.id ?? null
  }
}

export interface UpdateNewbieTaskInput extends NewbieTaskMutationInput {
  id: number
}

export class UpdateNewbieTaskCommand {
  private readonly db: DB

  constructor(private readonly input: UpdateNewbieTaskInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const categoryId = await getOrCreateTaskCategoryId(this.db, this.input.categoryName)
    const values = buildTaskRow(this.input, categoryId)

    const [result] = await this.db
      .update(newbieTasks)
      .set(values)
      .where(eq(newbieTasks.id, this.input.id))

    return result.affectedRows > 0
  }
}

export interface DeleteNewbieTaskInput {
  id: number
}

export class DeleteNewbieTaskCommand {
  private readonly db: DB

  constructor(private readonly input: DeleteNewbieTaskInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(newbieTasks)
      .where(eq(newbieTasks.id, this.input.id))

    return result.affectedRows > 0
  }
}

export interface ReorderNewbieTasksInStageInput {
  stageId: number
  orderedTaskIds: number[]
}

export class ReorderNewbieTasksInStageCommand {
  private readonly db: DB

  constructor(private readonly input: ReorderNewbieTasksInStageInput) {
    this.db = getDb()
  }

  async execute(): Promise<number> {
    return this.db.transaction(async (tx) => {
      const stageTaskRows = await tx
        .select({ id: newbieTasks.id })
        .from(newbieTasks)
        .where(eq(newbieTasks.stageId, this.input.stageId))

      const stageTaskIds = stageTaskRows.map((row) => row.id)
      const orderedTaskIds = this.input.orderedTaskIds

      validateTaskOrder(stageTaskIds, orderedTaskIds)

      for (const [index, taskId] of orderedTaskIds.entries()) {
        const [result] = await tx
          .update(newbieTasks)
          .set({ displayOrder: index })
          .where(and(eq(newbieTasks.id, taskId), eq(newbieTasks.stageId, this.input.stageId)))

        if (result.affectedRows === 0) {
          throw new Error('保存排序失败，请刷新后重试')
        }
      }

      return orderedTaskIds.length
    })
  }
}
