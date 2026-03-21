import { eq } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { users } from '../db/schema'

export interface UpdateUserAvatarInput {
  openid: string
  avatar: string
}

export interface UpdateUserAvatarResult {
  avatar: string
}

export class UpdateUserAvatarCommand {
  private readonly db: DB
  private readonly input: UpdateUserAvatarInput

  constructor(input: UpdateUserAvatarInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<UpdateUserAvatarResult> {
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
        avatar: this.input.avatar,
      })
      .where(eq(users.id, user.id))

    return {
      avatar: this.input.avatar,
    }
  }
}
