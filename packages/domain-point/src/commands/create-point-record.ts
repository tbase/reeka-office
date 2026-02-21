import { and, count, eq, sql } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import {
  agentPointBalances,
  pointItems,
  pointRecords,
  type NewPointRecordRow,
} from '../schema'

export interface CreatePointRecordInput {
  agentCode: string
  pointItemId: number
  points?: number
  occurredYear?: number
  remark?: string | null
  createdBy: number
}

export class CreatePointRecordCommand {
  private readonly db: DB

  constructor(private readonly input: CreatePointRecordInput) {
    this.db = getDb()
  }

  async execute(): Promise<number | null> {
    const pointItemRows = await this.db
      .select({
        id: pointItems.id,
        pointAmount: pointItems.pointAmount,
        annualLimit: pointItems.annualLimit,
      })
      .from(pointItems)
      .where(eq(pointItems.id, this.input.pointItemId))
      .limit(1)

    const pointItem = pointItemRows[0]
    if (!pointItem) {
      throw new Error('Point item not found')
    }

    const points = this.input.points ?? pointItem.pointAmount
    if (!points || points <= 0) {
      throw new Error('Points must be a positive number')
    }

    const occurredYear = this.input.occurredYear ?? new Date().getFullYear()

    if (pointItem.annualLimit !== null && pointItem.annualLimit >= 0) {
      const usageRows = await this.db
        .select({ value: count() })
        .from(pointRecords)
        .where(
          and(
            eq(pointRecords.agentCode, this.input.agentCode),
            eq(pointRecords.pointItemId, this.input.pointItemId),
            eq(pointRecords.occurredYear, occurredYear),
          ),
        )

      const usedCount = Number(usageRows[0]?.value ?? 0)
      if (usedCount >= pointItem.annualLimit) {
        throw new Error('Annual limit reached for this point item')
      }
    }

    return this.db.transaction(async (tx) => {
      const values: NewPointRecordRow = {
        agentCode: this.input.agentCode,
        pointItemId: this.input.pointItemId,
        points,
        occurredYear,
        remark: this.input.remark ?? null,
        createdBy: this.input.createdBy,
      }

      const result = await tx.insert(pointRecords).values(values).$returningId()

      await tx
        .insert(agentPointBalances)
        .values({
          agentCode: this.input.agentCode,
          currentPoints: points,
        })
        .onDuplicateKeyUpdate({
          set: {
            currentPoints: sql`${agentPointBalances.currentPoints} + ${points}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        })

      return result[0]?.id ?? null
    })
  }
}
