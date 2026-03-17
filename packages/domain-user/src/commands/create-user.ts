import { getDb, type DB } from '../context'
import { users } from '../db/schema'

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
  private readonly input: CreateUserInput

  constructor(input: CreateUserInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<CreateUserResult> {
    const agent = await this.db.query.agents.findFirst({
      where: (table, { eq }) => eq(table.id, this.input.agentId),
    })

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
        role: 'agent',
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
