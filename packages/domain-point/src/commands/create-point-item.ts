import { getDb, type DB } from '../context'
import { pointItems, type NewPointItemRow, type PointItemStandard } from '../schema'
import type { TenantScope } from '../scope'

export interface CreatePointItemInput {
  name: string
  category: string
  pointAmount?: number | null
  annualLimit?: number | null
  standard?: PointItemStandard | null
  createdBy: number
}

export class CreatePointItemCommand {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: CreatePointItemInput

  constructor(scope: TenantScope, input: CreatePointItemInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async execute(): Promise<number | null> {
    const values: NewPointItemRow = {
      tenantId: this.scope.tenantId,
      name: this.input.name,
      category: this.input.category,
      pointAmount: this.input.pointAmount ?? null,
      annualLimit: this.input.annualLimit ?? null,
      standard: this.input.standard ?? null,
      createdBy: this.input.createdBy,
    }
    const result = await this.db.insert(pointItems).values(values).$returningId()
    return result[0]?.id ?? null
  }
}
