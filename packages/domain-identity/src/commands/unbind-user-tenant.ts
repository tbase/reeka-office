import { and, eq, isNull } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { userTenantBindings, users } from '../db/schema'
import { ListUserTenantsQuery, type ListUserTenantsResult } from '../queries/list-user-tenants'

export interface UnbindUserTenantInput {
  openid: string
  tenantCode: string
}

export interface UnbindUserTenantResult {
  tenantCode: string
  tenants: ListUserTenantsResult
}

export class UnbindUserTenantCommand {
  private readonly db: DB
  private readonly input: UnbindUserTenantInput

  constructor(input: UnbindUserTenantInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<UnbindUserTenantResult> {
    const tenantCode = this.input.tenantCode.trim()
    if (!tenantCode) {
      throw new Error('租户不能为空')
    }

    return this.db.transaction(async (tx) => {
      const bindingRows = await tx
        .select({
          id: userTenantBindings.id,
        })
        .from(users)
        .innerJoin(userTenantBindings, eq(users.id, userTenantBindings.userId))
        .where(and(
          eq(users.openid, this.input.openid),
          eq(userTenantBindings.tenantCode, tenantCode),
          isNull(userTenantBindings.unboundAt),
        ))
        .limit(1)

      const binding = bindingRows[0]
      if (!binding) {
        throw new Error('当前身份已解绑或不存在')
      }

      await tx
        .update(userTenantBindings)
        .set({
          unboundAt: new Date(),
        })
        .where(eq(userTenantBindings.id, binding.id))

      return {
        tenantCode,
        tenants: await new ListUserTenantsQuery({ openid: this.input.openid, db: tx }).query(),
      }
    })
  }
}
