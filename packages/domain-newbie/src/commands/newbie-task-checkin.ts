import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import {
  newbieTaskCheckins,
  newbieTasks,
  type NewNewbieTaskCheckinRow,
} from '../schema'

export interface SubmitNewbieTaskCheckinInput {
  agentCode: string
  taskId: number
  evidenceFileIds: string[]
}

interface NewbieTaskCheckinEvidencePayload {
  fileIds: string[]
}

function normalizeEvidenceFileIds(evidenceFileIds: string[]): string[] {
  return evidenceFileIds
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export class SubmitNewbieTaskCheckinCommand {
  private readonly db: DB

  constructor(private readonly input: SubmitNewbieTaskCheckinInput) {
    this.db = getDb()
  }

  async execute(): Promise<number | null> {
    const evidenceFileIds = normalizeEvidenceFileIds(this.input.evidenceFileIds)

    return this.db.transaction(async (tx) => {
      const taskRows = await tx
        .select({ id: newbieTasks.id })
        .from(newbieTasks)
        .where(eq(newbieTasks.id, this.input.taskId))
        .limit(1)

      if (!taskRows[0]) {
        throw new Error('任务不存在')
      }

      const existingRows = await tx
        .select({ id: newbieTaskCheckins.id })
        .from(newbieTaskCheckins)
        .where(
          and(
            eq(newbieTaskCheckins.agentCode, this.input.agentCode),
            eq(newbieTaskCheckins.taskId, this.input.taskId),
          ),
        )
        .limit(1)

      if (existingRows[0]) {
        throw new Error('该任务已完成，无需重复打卡')
      }

      const values: NewNewbieTaskCheckinRow = {
        agentCode: this.input.agentCode,
        taskId: this.input.taskId,
        evidence: JSON.stringify({
          fileIds: evidenceFileIds,
        } satisfies NewbieTaskCheckinEvidencePayload),
      }

      const result = await tx.insert(newbieTaskCheckins).values(values).$returningId()
      return result[0]?.id ?? null
    })
  }
}
