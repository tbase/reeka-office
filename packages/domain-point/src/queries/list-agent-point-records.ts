import { and, count, desc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { pointItems, pointRecords, type PointRecordRow } from '../schema'

export interface ListAgentPointRecordsInput {
  agentId: number
  pointItemId?: number
}

export interface AgentPointRecordItem extends PointRecordRow {
  pointItemName: string
  pointItemCategory: string
}

export interface ListAgentPointRecordsResult {
  records: AgentPointRecordItem[]
  total: number
}

export class ListAgentPointRecordsQuery {
  private readonly db: DB
  private readonly input: ListAgentPointRecordsInput

  constructor(input: ListAgentPointRecordsInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ListAgentPointRecordsResult> {
    const whereClause = this.input.pointItemId
      ? and(
          eq(pointRecords.agentId, this.input.agentId),
          eq(pointRecords.pointItemId, this.input.pointItemId),
        )
      : and(
          eq(pointRecords.agentId, this.input.agentId),
        )

    const [rows, totalRows] = await Promise.all([
      this.db
        .select({
          id: pointRecords.id,
          agentId: pointRecords.agentId,
          pointItemId: pointRecords.pointItemId,
          points: pointRecords.points,
          occurredYear: pointRecords.occurredYear,
          sourceType: pointRecords.sourceType,
          sourceRef: pointRecords.sourceRef,
          remark: pointRecords.remark,
          createdBy: pointRecords.createdBy,
          createdAt: pointRecords.createdAt,
          pointItemName: pointItems.name,
          pointItemCategory: pointItems.category,
        })
        .from(pointRecords)
        .innerJoin(pointItems, eq(pointItems.id, pointRecords.pointItemId))
        .where(whereClause)
        .orderBy(desc(pointRecords.createdAt)),
      this.db.select({ value: count() }).from(pointRecords).where(whereClause),
    ])

    return {
      records: rows,
      total: Number(totalRows[0]?.value ?? 0),
    }
  }
}
