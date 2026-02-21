import { getDb, type DB } from '../context'
import { pointItems, type NewPointItemRow, type PointItemStandard } from '../schema'

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

  constructor(private readonly input: CreatePointItemInput) {
    this.db = getDb()
  }

  async execute(): Promise<number | null> {
    const values: NewPointItemRow = {
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
