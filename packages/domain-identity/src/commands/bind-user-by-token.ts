import { and, eq, isNull, or } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { bindingTokens, tenants, userTenantBindings, users } from '../db/schema'
import { ListUserTenantsQuery, type ListUserTenantsResult } from '../queries/list-user-tenants'

export interface BindUserByTokenInput {
  openid: string
  token: string
}

export interface BindUserByTokenResult {
  userId: number
  tenantCode: string
  agentId: number
  tenants: ListUserTenantsResult
}

export class BindUserByTokenCommand {
  private readonly db: DB
  private readonly input: BindUserByTokenInput

  constructor(input: BindUserByTokenInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<BindUserByTokenResult> {
    const token = this.input.token.trim().toUpperCase()
    if (!token) {
      throw new Error('绑定码不能为空')
    }

    return this.db.transaction(async (tx) => {
      const tokenRows = await tx
        .select({
          token: bindingTokens.token,
          tenantCode: bindingTokens.tenantCode,
          agentId: bindingTokens.agentId,
          expiresAt: bindingTokens.expiresAt,
          boundAt: bindingTokens.boundAt,
          boundUserId: bindingTokens.boundUserId,
          tenantStatus: tenants.status,
        })
        .from(bindingTokens)
        .innerJoin(tenants, eq(bindingTokens.tenantCode, tenants.tenantCode))
        .where(eq(bindingTokens.token, token))
        .limit(1)

      const bindingToken = tokenRows[0]
      if (!bindingToken || bindingToken.tenantStatus !== 'active') {
        throw new Error('绑定码不存在或已失效')
      }

      if (bindingToken.boundAt || bindingToken.boundUserId) {
        throw new Error('绑定码已被使用')
      }

      if (new Date(bindingToken.expiresAt).getTime() <= Date.now()) {
        throw new Error('绑定码已过期')
      }

      const existingAgentBindingRows = await tx
        .select({ id: userTenantBindings.id })
        .from(userTenantBindings)
        .where(and(
          eq(userTenantBindings.tenantCode, bindingToken.tenantCode),
          eq(userTenantBindings.agentId, bindingToken.agentId),
          isNull(userTenantBindings.unboundAt),
        ))
        .limit(1)

      if (existingAgentBindingRows[0]) {
        throw new Error('该代理人已绑定用户')
      }

      const existingUserRows = await tx
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.openid, this.input.openid))
        .limit(1)

      let userId = existingUserRows[0]?.id ?? null

      if (!userId) {
        await tx.insert(users).values({
          openid: this.input.openid,
        })
        const createdUserRows = await tx
          .select({
            id: users.id,
          })
          .from(users)
          .where(eq(users.openid, this.input.openid))
          .limit(1)

        userId = createdUserRows[0]?.id ?? null
      }

      if (!userId) {
        throw new Error('创建用户失败')
      }

      const existingTenantBindingRows = await tx
        .select({ id: userTenantBindings.id })
        .from(userTenantBindings)
        .where(and(
          eq(userTenantBindings.userId, userId),
          eq(userTenantBindings.tenantCode, bindingToken.tenantCode),
          isNull(userTenantBindings.unboundAt),
        ))
        .limit(1)

      if (existingTenantBindingRows[0]) {
        throw new Error('当前租户已绑定代理人')
      }

      const inactiveBlockingRows = await tx
        .select({
          id: userTenantBindings.id,
          userId: userTenantBindings.userId,
          tenantCode: userTenantBindings.tenantCode,
          agentId: userTenantBindings.agentId,
          unboundAt: userTenantBindings.unboundAt,
        })
        .from(userTenantBindings)
        .where(or(
          and(
            eq(userTenantBindings.tenantCode, bindingToken.tenantCode),
            eq(userTenantBindings.agentId, bindingToken.agentId),
          ),
          and(
            eq(userTenantBindings.userId, userId),
            eq(userTenantBindings.tenantCode, bindingToken.tenantCode),
          ),
        ))

      const inactiveRows = inactiveBlockingRows.filter(row => row.unboundAt)
      const reusableRow = inactiveRows.find(row =>
        row.userId === userId
        && row.tenantCode === bindingToken.tenantCode,
      ) ?? inactiveRows[0] ?? null

      for (const row of inactiveRows) {
        if (row.id === reusableRow?.id) {
          continue
        }

        await tx
          .delete(userTenantBindings)
          .where(eq(userTenantBindings.id, row.id))
      }

      if (reusableRow) {
        await tx
          .update(userTenantBindings)
          .set({
            userId,
            tenantCode: bindingToken.tenantCode,
            agentId: bindingToken.agentId,
            boundAt: new Date(),
            unboundAt: null,
          })
          .where(eq(userTenantBindings.id, reusableRow.id))
      }
      else {
        await tx.insert(userTenantBindings).values({
          userId,
          tenantCode: bindingToken.tenantCode,
          agentId: bindingToken.agentId,
        })
      }

      await tx
        .update(bindingTokens)
        .set({
          boundAt: new Date(),
          boundUserId: userId,
        })
        .where(eq(bindingTokens.token, token))

      const userTenants = await new ListUserTenantsQuery({ openid: this.input.openid, db: tx }).query()

      return {
        userId,
        tenantCode: bindingToken.tenantCode,
        agentId: bindingToken.agentId,
        tenants: userTenants,
      }
    })
  }
}
