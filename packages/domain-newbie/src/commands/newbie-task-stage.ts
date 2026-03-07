import { eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { newbieTaskStages, type NewNewbieTaskStageRow } from '../schema'

export interface CreateNewbieTaskStageInput {
  stage: string
  title: string
  description?: string | null
}

export class CreateNewbieTaskStageCommand {
  private readonly db: DB

  constructor(private readonly input: CreateNewbieTaskStageInput) {
    this.db = getDb()
  }

  async execute(): Promise<number | null> {
    const values: NewNewbieTaskStageRow = {
      stage: this.input.stage,
      title: this.input.title,
      description: this.input.description ?? null,
    }

    const result = await this.db.insert(newbieTaskStages).values(values).$returningId()
    return result[0]?.id ?? null
  }
}

export interface UpdateNewbieTaskStageInput {
  id: number
  stage: string
  title: string
  description?: string | null
}

export class UpdateNewbieTaskStageCommand {
  private readonly db: DB

  constructor(private readonly input: UpdateNewbieTaskStageInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const values: Partial<NewNewbieTaskStageRow> = {
      stage: this.input.stage,
      title: this.input.title,
      description: this.input.description ?? null,
    }

    const [result] = await this.db
      .update(newbieTaskStages)
      .set(values)
      .where(eq(newbieTaskStages.id, this.input.id))

    return result.affectedRows > 0
  }
}

export interface DeleteNewbieTaskStageInput {
  id: number
}

export class DeleteNewbieTaskStageCommand {
  private readonly db: DB

  constructor(private readonly input: DeleteNewbieTaskStageInput) {
    this.db = getDb()
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(newbieTaskStages)
      .where(eq(newbieTaskStages.id, this.input.id))

    return result.affectedRows > 0
  }
}
