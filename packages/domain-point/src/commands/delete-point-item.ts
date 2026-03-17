import { eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { pointItems } from '../schema'

export interface DeletePointItemInput {
  id: number
}

export class DeletePointItemCommand {
  private readonly db: DB
  private readonly input: DeletePointItemInput

  constructor(input: DeletePointItemInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(pointItems)
      .where(eq(pointItems.id, this.input.id))

    return result.affectedRows > 0
  }
}
