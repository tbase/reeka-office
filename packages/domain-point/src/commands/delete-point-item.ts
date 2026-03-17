import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { pointItems } from '../schema'
import type { TenantScope } from '../scope'

export interface DeletePointItemInput {
  id: number
}

export class DeletePointItemCommand {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: DeletePointItemInput

  constructor(scope: TenantScope, input: DeletePointItemInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(pointItems)
      .where(and(
        eq(pointItems.tenantId, this.scope.tenantId),
        eq(pointItems.id, this.input.id),
      ))

    return result.affectedRows > 0
  }
}
