import { eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agents, users } from '../db/schema'

export interface BindAgentInput {
  openid: string
  agentCode: string
  agentName: string
}

export interface BindAgentResult {
  agentCode: string
  agentName: string
}

export class BindAgentCommand {
  private readonly db: DB

  constructor(private readonly input: BindAgentInput) {
    this.db = getDb()
  }

  async execute(): Promise<BindAgentResult> {
    return this.db.transaction(async (tx) => {
      const agentRows = await tx
        .select()
        .from(agents)
        .where(eq(agents.agentCode, this.input.agentCode))
        .limit(1)

      const existingAgent = agentRows[0]
      const agentCode = existingAgent?.agentCode ?? this.input.agentCode
      const agentName = existingAgent?.name ?? this.input.agentName

      if (!existingAgent) {
        await tx.insert(agents).values({
          agentCode,
          name: agentName,
        })
      }

      const userRows = await tx
        .select()
        .from(users)
        .where(eq(users.openid, this.input.openid))
        .limit(1)

      const user = userRows[0]
      if (!user) {
        await tx.insert(users).values({
          openid: this.input.openid,
          agentCode,
        })
      } else if (!user.agentCode) {
        await tx
          .update(users)
          .set({
            agentCode,
          })
          .where(eq(users.id, user.id))
      } else {
        throw new Error('用户已绑定代理人')
      }

      return {
        agentCode,
        agentName,
      }
    })
  }
}
