import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { pointItems, type NewPointItemRow, type PointItemStandard } from '../schema'
import type { TenantScope } from '../scope'

export interface UpdatePointItemInput {
  id: number
  name?: string
  category?: string
  pointAmount?: number | null
  annualLimit?: number | null
  standard?: PointItemStandard | null
}

export class UpdatePointItemCommand {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: UpdatePointItemInput

  constructor(scope: TenantScope, input: UpdatePointItemInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<boolean> {
    const values: Partial<NewPointItemRow> = {
      name: this.input.name,
      category: this.input.category,
      pointAmount: this.input.pointAmount,
      annualLimit: this.input.annualLimit,
      standard: this.input.standard,
    }

    const [result] = await this.db
      .update(pointItems)
      .set(values)
      .where(and(
        eq(pointItems.tenantId, this.scope.tenantId),
        eq(pointItems.id, this.input.id),
      ))

    return result.affectedRows > 0
  }
}
