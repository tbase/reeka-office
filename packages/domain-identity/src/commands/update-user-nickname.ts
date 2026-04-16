import { eq } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { users } from '../db/schema'

export interface UpdateUserNicknameInput {
  openid: string
  nickname: string | null
}

export interface UpdateUserNicknameResult {
  nickname: string | null
}

export class UpdateUserNicknameCommand {
  private readonly db: DB
  private readonly input: UpdateUserNicknameInput

  constructor(input: UpdateUserNicknameInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<UpdateUserNicknameResult> {
    const nickname = this.input.nickname?.trim() || null
    const userRows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.openid, this.input.openid))
      .limit(1)

    const user = userRows[0]
    if (!user) {
      throw new Error('用户不存在')
    }

    await this.db
      .update(users)
      .set({
        nickname,
      })
      .where(eq(users.id, user.id))

    return {
      nickname,
    }
  }
}
