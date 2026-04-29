import { and, eq, isNull, or } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { inviteShareTokens, tenants, userTenantBindings, users } from '../db/schema'
import { ListUserTenantsQuery, type ListUserTenantsResult } from '../queries/list-user-tenants'

export interface BindUserByInviteShareTokenInput {
  openid: string
  token: string
  tenantCode: string
  agentId: number
}

export interface BindUserByInviteShareTokenResult {
  userId: number
  tenantCode: string
  agentId: number
  tenants: ListUserTenantsResult
}

export class BindUserByInviteShareTokenCommand {
  private readonly db: DB
  private readonly input: BindUserByInviteShareTokenInput

  constructor(input: BindUserByInviteShareTokenInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<BindUserByInviteShareTokenResult> {
    const token = this.input.token.trim()
    const tenantCode = this.input.tenantCode.trim()

    if (!token) {
      throw new Error('邀请链接无效')
    }

    if (!tenantCode) {
      throw new Error('租户不能为空')
    }

    if (!Number.isInteger(this.input.agentId) || this.input.agentId <= 0) {
      throw new Error('代理人身份无效')
    }

    return this.db.transaction(async (tx) => {
      const tokenRows = await tx
        .select({
          token: inviteShareTokens.token,
          tenantCode: inviteShareTokens.tenantCode,
          expiresAt: inviteShareTokens.expiresAt,
          tenantStatus: tenants.status,
        })
        .from(inviteShareTokens)
        .innerJoin(tenants, eq(inviteShareTokens.tenantCode, tenants.tenantCode))
        .where(eq(inviteShareTokens.token, token))
        .limit(1)

      const inviteToken = tokenRows[0]
      if (!inviteToken || inviteToken.tenantStatus !== 'active') {
        throw new Error('邀请链接不存在或已失效')
      }

      if (inviteToken.tenantCode !== tenantCode) {
        throw new Error('邀请链接租户不匹配')
      }

      if (new Date(inviteToken.expiresAt).getTime() <= Date.now()) {
        throw new Error('邀请链接已过期')
      }

      const existingAgentBindingRows = await tx
        .select({ id: userTenantBindings.id })
        .from(userTenantBindings)
        .where(and(
          eq(userTenantBindings.tenantCode, tenantCode),
          eq(userTenantBindings.agentId, this.input.agentId),
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
          eq(userTenantBindings.tenantCode, tenantCode),
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
            eq(userTenantBindings.tenantCode, tenantCode),
            eq(userTenantBindings.agentId, this.input.agentId),
          ),
          and(
            eq(userTenantBindings.userId, userId),
            eq(userTenantBindings.tenantCode, tenantCode),
          ),
        ))

      const inactiveRows = inactiveBlockingRows.filter(row => row.unboundAt)
      const reusableRow = inactiveRows.find(row =>
        row.userId === userId
        && row.tenantCode === tenantCode,
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
            tenantCode,
            agentId: this.input.agentId,
            boundAt: new Date(),
            unboundAt: null,
          })
          .where(eq(userTenantBindings.id, reusableRow.id))
      }
      else {
        await tx.insert(userTenantBindings).values({
          userId,
          tenantCode,
          agentId: this.input.agentId,
        })
      }

      return {
        userId,
        tenantCode,
        agentId: this.input.agentId,
        tenants: await new ListUserTenantsQuery({ openid: this.input.openid, db: tx }).query(),
      }
    })
  }
}
