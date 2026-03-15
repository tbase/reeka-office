import { eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agents, users } from '../db/schema'

export interface CreateUserInput {
  openid: string
  agentId: number
  nickname?: string | null
  avatar?: string | null
}

export interface CreateUserResult {
  id: number
  openid: string
  agentId: number
  agentCode: string | null
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
      .where(eq(agents.id, this.input.agentId))
      .limit(1)

    const agent = agentRows[0]
    if (!agent) {
      throw new Error(`Agent not found: ${this.input.agentId}`)
    }

    const result = await this.db
      .insert(users)
      .values({
        openid: this.input.openid,
        agentId: this.input.agentId,
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
      agentId: agent.id,
      agentCode: agent.agentCode,
      agentName: agent.name,
    }
  }
}
