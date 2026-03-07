import { asc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { newbieTaskStages, type NewbieTaskStageRow } from '../schema'

export interface GetNewbieTaskStageInput {
  id: number
}

export class GetNewbieTaskStageQuery {
  private readonly db: DB

  constructor(private readonly input: GetNewbieTaskStageInput) {
    this.db = getDb()
  }

  async query(): Promise<NewbieTaskStageRow | null> {
    const result = await this.db
      .select()
      .from(newbieTaskStages)
      .where(eq(newbieTaskStages.id, this.input.id))

    return result[0] ?? null
  }
}

export class ListNewbieTaskStagesQuery {
  private readonly db: DB

  constructor() {
    this.db = getDb()
  }

  async query(): Promise<NewbieTaskStageRow[]> {
    return this.db
      .select()
      .from(newbieTaskStages)
      .orderBy(asc(newbieTaskStages.stage))
  }
}
