import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { newbieTaskCheckins, type NewbieTaskCheckinRow } from '../schema'

export interface NewbieTaskCheckinItem extends NewbieTaskCheckinRow {
  evidenceFileIds: string[]
}

export interface GetNewbieTaskCheckinInput {
  agentCode: string
  taskId: number
}

export interface ListNewbieTaskCheckinsInput {
  agentCode: string
}

interface NewbieTaskCheckinEvidencePayload {
  fileIds?: unknown
}

function parseEvidenceFileIds(evidence: string): string[] {
  try {
    const parsed = JSON.parse(evidence) as unknown

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
    }

    const fileIds = (parsed as NewbieTaskCheckinEvidencePayload).fileIds
    if (!Array.isArray(fileIds)) {
      return []
    }

    return fileIds.filter((item): item is string => typeof item === 'string' && item.length > 0)
  } catch {
    return []
  }
}

function mapCheckin(row: NewbieTaskCheckinRow): NewbieTaskCheckinItem {
  return {
    ...row,
    evidenceFileIds: parseEvidenceFileIds(row.evidence),
  }
}

export class GetNewbieTaskCheckinQuery {
  private readonly db: DB

  constructor(private readonly input: GetNewbieTaskCheckinInput) {
    this.db = getDb()
  }

  async query(): Promise<NewbieTaskCheckinItem | null> {
    const rows = await this.db
      .select()
      .from(newbieTaskCheckins)
      .where(
        and(
          eq(newbieTaskCheckins.agentCode, this.input.agentCode),
          eq(newbieTaskCheckins.taskId, this.input.taskId),
        ),
      )
      .limit(1)

    const row = rows[0]
    return row ? mapCheckin(row) : null
  }
}

export class ListNewbieTaskCheckinsQuery {
  private readonly db: DB

  constructor(private readonly input: ListNewbieTaskCheckinsInput) {
    this.db = getDb()
  }

  async query(): Promise<NewbieTaskCheckinItem[]> {
    const rows = await this.db
      .select()
      .from(newbieTaskCheckins)
      .where(eq(newbieTaskCheckins.agentCode, this.input.agentCode))

    return rows.map(mapCheckin)
  }
}
