import { and, count, desc, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { pointItems, pointRecords, type PointRecordRow } from '../schema'

export interface ListAgentPointRecordsInput {
  agentCode: string
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

  constructor(private readonly input: ListAgentPointRecordsInput) {
    this.db = getDb()
  }

  async query(): Promise<ListAgentPointRecordsResult> {
    const whereClause = this.input.pointItemId
      ? and(
          eq(pointRecords.agentCode, this.input.agentCode),
          eq(pointRecords.pointItemId, this.input.pointItemId),
        )
      : eq(pointRecords.agentCode, this.input.agentCode)

    const [rows, totalRows] = await Promise.all([
      this.db
        .select({
          id: pointRecords.id,
          agentCode: pointRecords.agentCode,
          pointItemId: pointRecords.pointItemId,
          points: pointRecords.points,
          occurredYear: pointRecords.occurredYear,
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
