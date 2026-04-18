import { and, eq, isNull } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { agents } from '../db/schema'

export interface UpdateAgentLastPromotionDateInput {
  agentCode: string
  lastPromotionDate: string | null
}

export interface UpdateAgentLastPromotionDateResult {
  agentCode: string
  lastPromotionDate: string | null
}

export class UpdateAgentLastPromotionDateCommand {
  private readonly db: DB
  private readonly input: UpdateAgentLastPromotionDateInput

  constructor(input: UpdateAgentLastPromotionDateInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<UpdateAgentLastPromotionDateResult> {
    const agentCode = this.input.agentCode.trim().toUpperCase()
    const lastPromotionDate = normalizeLastPromotionDate(this.input.lastPromotionDate)

    if (!agentCode) {
      throw new Error('代理人编码不能为空')
    }

    const rows = await this.db
      .select({
        agentCode: agents.agentCode,
      })
      .from(agents)
      .where(and(
        eq(agents.agentCode, agentCode),
        isNull(agents.deletedAt),
      ))
      .limit(1)

    if (!rows[0]?.agentCode) {
      throw new Error(`代理人不存在: ${agentCode}`)
    }

    await this.db
      .update(agents)
      .set({
        lastPromotionDate,
      })
      .where(eq(agents.agentCode, agentCode))

    return {
      agentCode,
      lastPromotionDate,
    }
  }
}

function normalizeLastPromotionDate(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim()
  if (!normalizedValue) {
    return null
  }

  const monthMatched = normalizedValue.match(/^(\d{4})-(\d{2})$/)
  if (monthMatched) {
    return `${monthMatched[1]}-${monthMatched[2]}-01`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue
  }

  throw new Error('上次晋级日期格式无效')
}
