import { and, count, eq, sql } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import {
  agentPointBalances,
  pointItems,
  pointRecords,
  type NewPointRecordRow,
} from '../schema'

export interface CreatePointRecordInput {
  agentId: number
  pointItemId: number
  points?: number
  occurredYear?: number
  sourceType?: string | null
  sourceRef?: string | null
  remark?: string | null
  createdBy: number
}

export class CreatePointRecordCommand {
  private readonly db: DB
  private readonly input: CreatePointRecordInput

  constructor(input: CreatePointRecordInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<number | null> {
    const sourceType = this.input.sourceType?.trim() ?? null
    const sourceRef = this.input.sourceRef?.trim() ?? null

    if ((sourceType && !sourceRef) || (!sourceType && sourceRef)) {
      throw new Error('Source type and source ref must be provided together')
    }

    if (sourceType && sourceRef) {
      const existingRows = await this.db
        .select({ id: pointRecords.id })
        .from(pointRecords)
        .where(and(
          eq(pointRecords.sourceType, sourceType),
          eq(pointRecords.sourceRef, sourceRef),
        ))
        .limit(1)

      if (existingRows[0]?.id) {
        return existingRows[0].id
      }
    }

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
            eq(pointRecords.agentId, this.input.agentId),
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
        agentId: this.input.agentId,
        pointItemId: this.input.pointItemId,
        points,
        occurredYear,
        sourceType,
        sourceRef,
        remark: this.input.remark ?? null,
        createdBy: this.input.createdBy,
      }

      let result: Array<{ id: number }>
      try {
        result = await tx.insert(pointRecords).values(values).$returningId()
      } catch (error) {
        if (!sourceType || !sourceRef) {
          throw error
        }

        const existingRows = await tx
          .select({ id: pointRecords.id })
          .from(pointRecords)
          .where(and(
            eq(pointRecords.sourceType, sourceType),
            eq(pointRecords.sourceRef, sourceRef),
          ))
          .limit(1)

        if (existingRows[0]?.id) {
          return existingRows[0].id
        }

        throw error
      }

      await tx
        .insert(agentPointBalances)
        .values({
          agentId: this.input.agentId,
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
