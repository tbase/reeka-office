import { eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agents, users } from '../db/schema'

export interface CreateUserInput {
  openid: string
  agentCode: string
  nickname?: string | null
  avatar?: string | null
}

export interface CreateUserResult {
  id: number
  openid: string
  agentCode: string
  agentName: string
}

export class CreateUserCommand {
  private readonly db: DB

  constructor(private readonly input: CreateUserInput) {
    this.db = getDb()
  }

  async execute(): Promise<CreateUserResult> {
    const agentRows = await this.db
      .select()
      .from(agents)
      .where(eq(agents.agentCode, this.input.agentCode))
      .limit(1)

    const agent = agentRows[0]
    if (!agent) {
      throw new Error(`Agent not found: ${this.input.agentCode}`)
    }

    const result = await this.db
      .insert(users)
      .values({
        openid: this.input.openid,
        agentCode: this.input.agentCode,
        nickname: this.input.nickname ?? null,
        avatar: this.input.avatar ?? null,
      })
      .$returningId()

    const id = result[0]?.id
    if (!id) {
      throw new Error('Failed to create user')
    }

    return {
      id,
      openid: this.input.openid,
      agentCode: agent.agentCode,
      agentName: agent.name,
    }
  }
}
