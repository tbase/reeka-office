import { asc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import {
  newbieTaskCategories,
  newbieTasks,
  newbieTaskStages,
  type NewbieTaskRow,
} from '../schema'

export interface NewbieTaskItem extends NewbieTaskRow {
  stage: string
  stageTitle: string
  categoryName: string
}

export interface GetNewbieTaskInput {
  id: number
}

export class GetNewbieTaskQuery {
  private readonly db: DB

  constructor(private readonly input: GetNewbieTaskInput) {
    this.db = getDb()
  }

  async query(): Promise<NewbieTaskItem | null> {
    const rows = await this.db
      .select({
        id: newbieTasks.id,
        title: newbieTasks.title,
        description: newbieTasks.description,
        stageId: newbieTasks.stageId,
        categoryId: newbieTasks.categoryId,
        displayOrder: newbieTasks.displayOrder,
        pointEventId: newbieTasks.pointEventId,
        pointAmount: newbieTasks.pointAmount,
        createdAt: newbieTasks.createdAt,
        updatedAt: newbieTasks.updatedAt,
        stage: newbieTaskStages.stage,
        stageTitle: newbieTaskStages.title,
        categoryName: newbieTaskCategories.name,
      })
      .from(newbieTasks)
      .innerJoin(newbieTaskStages, eq(newbieTaskStages.id, newbieTasks.stageId))
      .innerJoin(newbieTaskCategories, eq(newbieTaskCategories.id, newbieTasks.categoryId))
      .where(eq(newbieTasks.id, this.input.id))
      .limit(1)

    return rows[0] ?? null
  }
}

export class ListNewbieTasksQuery {
  private readonly db: DB

  constructor() {
    this.db = getDb()
  }

  async query(): Promise<NewbieTaskItem[]> {
    return this.db
      .select({
        id: newbieTasks.id,
        title: newbieTasks.title,
        description: newbieTasks.description,
        stageId: newbieTasks.stageId,
        categoryId: newbieTasks.categoryId,
        displayOrder: newbieTasks.displayOrder,
        pointEventId: newbieTasks.pointEventId,
        pointAmount: newbieTasks.pointAmount,
        createdAt: newbieTasks.createdAt,
        updatedAt: newbieTasks.updatedAt,
        stage: newbieTaskStages.stage,
        stageTitle: newbieTaskStages.title,
        categoryName: newbieTaskCategories.name,
      })
      .from(newbieTasks)
      .innerJoin(newbieTaskStages, eq(newbieTaskStages.id, newbieTasks.stageId))
      .innerJoin(newbieTaskCategories, eq(newbieTaskCategories.id, newbieTasks.categoryId))
      .orderBy(asc(newbieTasks.displayOrder), asc(newbieTasks.id))
  }
}
