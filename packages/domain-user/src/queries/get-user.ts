import { eq } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agents, users } from '../db/schema'
import type { User } from '../types'

export interface GetUserInput {
  openid: string
}

export type GetUserResult = User | null

export class GetUserQuery {
  private readonly db: DB

  constructor(private readonly input: GetUserInput) {
    this.db = getDb()
  }

  async query(): Promise<GetUserResult | null> {
    const rows = await this.db
      .select({
        id: users.id,
        openid: users.openid,
        nickname: users.nickname,
        avatar: users.avatar,
        role: users.role,
        agentId: users.agentId,
        tenantId: agents.tenantId,
        agentCode: agents.agentCode,
        agentName: agents.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(agents, eq(users.agentId, agents.id))
      .where(eq(users.openid, this.input.openid))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return null
    }

    return {
      id: row.id,
      openid: row.openid,
      nickname: row.nickname ?? null,
      avatar: row.avatar ?? null,
      role: row.role,
      agentId: row.agentId ?? null,
      tenantId: row.tenantId ?? null,
      agentCode: row.agentCode ?? null,
      agentName: row.agentName ?? null,
      createdAt: row.createdAt ?? null,
      updatedAt: row.updatedAt ?? null,
    }
  }
}
