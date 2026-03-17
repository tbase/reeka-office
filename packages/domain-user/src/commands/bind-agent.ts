import { and, eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agents, users } from '../db/schema'

export interface BindAgentInput {
  openid: string
  code: string
  leaderCode: string
  unit: string
}

export interface BindAgentResult {
  agentId: number
  agentCode: string
  agentName: string
}

export class BindAgentCommand {
  private readonly db: DB
  private readonly input: BindAgentInput

  constructor(input: BindAgentInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<BindAgentResult> {
    return this.db.transaction(async (tx) => {
      const agentRows = await tx
        .select({
          id: agents.id,
          agentCode: agents.agentCode,
          name: agents.name,
        })
        .from(agents)
        .where(and(
          eq(agents.agentCode, this.input.code),
          eq(agents.leaderCode, this.input.leaderCode),
          eq(agents.unit, this.input.unit),
        ))
        .limit(1)

      const existingAgent = agentRows[0]
      if (!existingAgent) {
        throw new Error('代理人不存在')
      }

      const agentId = existingAgent.id

      const userRows = await tx
        .select()
        .from(users)
        .where(eq(users.openid, this.input.openid))
        .limit(1)

      const user = userRows[0]
      if (!user) {
        await tx.insert(users).values({
          openid: this.input.openid,
          agentId,
        })
      } else if (!user.agentId) {
        await tx
          .update(users)
          .set({
            agentId,
          })
          .where(eq(users.id, user.id))
      } else {
        throw new Error('用户已绑定代理人')
      }

      return {
        agentId,
        agentCode: existingAgent.agentCode ?? this.input.code,
        agentName: existingAgent.name,
      }
    })
  }
}
