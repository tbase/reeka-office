import { and, eq, isNull } from 'drizzle-orm'

import { appendAgentLogs, type AppendAgentLogInput } from '../agent-log'
import { getDb, type DB, type DBExecutor } from '../context'
import { agents } from '../db/schema'

export interface UpdateAgentLastPromotionDateInput {
  agentCode: string
  lastPromotionDate: string | null
}

export interface UpdateAgentLastPromotionDateResult {
  agentCode: string
  lastPromotionDate: string | null
}

interface ActiveAgentRow {
  id: number
  agentCode: string
  lastPromotionDate: string | null
}

interface UpdateAgentLastPromotionDateRuntime {
  findActiveAgentByCode(agentCode: string): Promise<ActiveAgentRow | null>
  updateAgentLastPromotionDateById(id: number, lastPromotionDate: string | null): Promise<void>
  appendAgentLogs(logs: AppendAgentLogInput[]): Promise<void>
}

interface UpdateAgentLastPromotionDateDependencies {
  executeInTransaction<T>(work: (runtime: UpdateAgentLastPromotionDateRuntime) => Promise<T>): Promise<T>
}

function createUpdateAgentLastPromotionDateRuntime(db: DBExecutor): UpdateAgentLastPromotionDateRuntime {
  return {
    async findActiveAgentByCode(agentCode) {
      const rows = await db
        .select({
          id: agents.id,
          agentCode: agents.agentCode,
          lastPromotionDate: agents.lastPromotionDate,
        })
        .from(agents)
        .where(and(
          eq(agents.agentCode, agentCode),
          isNull(agents.deletedAt),
        ))
        .limit(1)

      const row = rows[0]
      if (!row?.agentCode) {
        return null
      }

      return {
        id: row.id,
        agentCode: row.agentCode,
        lastPromotionDate: row.lastPromotionDate,
      }
    },
    async updateAgentLastPromotionDateById(id, lastPromotionDate) {
      await db
        .update(agents)
        .set({
          lastPromotionDate,
        })
        .where(eq(agents.id, id))
    },
    appendAgentLogs(logs) {
      return appendAgentLogs(db, logs)
    },
  }
}

export class UpdateAgentLastPromotionDateCommand {
  private readonly input: UpdateAgentLastPromotionDateInput
  private readonly dependencies: UpdateAgentLastPromotionDateDependencies

  constructor(
    input: UpdateAgentLastPromotionDateInput,
    dependencies?: Partial<UpdateAgentLastPromotionDateDependencies>,
  ) {
    this.input = input
    const db = dependencies?.executeInTransaction ? null : getDb()
    this.dependencies = {
      executeInTransaction: dependencies?.executeInTransaction
        ?? ((work) => (db as DB).transaction((tx) => work(createUpdateAgentLastPromotionDateRuntime(tx)))),
    }
  }

  async execute(): Promise<UpdateAgentLastPromotionDateResult> {
    const agentCode = this.input.agentCode.trim().toUpperCase()
    const lastPromotionDate = normalizeLastPromotionDate(this.input.lastPromotionDate)

    if (!agentCode) {
      throw new Error('代理人编码不能为空')
    }

    return this.dependencies.executeInTransaction(async (runtime) => {
      const agent = await runtime.findActiveAgentByCode(agentCode)

      if (!agent) {
        throw new Error(`代理人不存在: ${agentCode}`)
      }

      if (agent.lastPromotionDate !== lastPromotionDate) {
        await runtime.updateAgentLastPromotionDateById(agent.id, lastPromotionDate)
        await runtime.appendAgentLogs([{
          agentCode,
          category: 'profile',
          action: 'updated',
          source: 'UpdateAgentLastPromotionDateCommand',
          changes: [{
            field: 'lastPromotionDate',
            before: agent.lastPromotionDate,
            after: lastPromotionDate,
          }],
        }])
      }

      return {
        agentCode,
        lastPromotionDate,
      }
    })
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
