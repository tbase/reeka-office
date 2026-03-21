import { and, eq, isNull } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { tenants, userTenantBindings, users } from '../db/schema'
import type { ResolvedTenantAgent } from '../types'

export interface ResolveTenantAgentByOpenIdInput {
  openid: string
  tenantCode: string
}

export type ResolveTenantAgentByOpenIdResult = ResolvedTenantAgent | null

export class ResolveTenantAgentByOpenIdQuery {
  private readonly db: DB
  private readonly input: ResolveTenantAgentByOpenIdInput

  constructor(input: ResolveTenantAgentByOpenIdInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ResolveTenantAgentByOpenIdResult> {
    const rows = await this.db
      .select({
        userId: users.id,
        openid: users.openid,
        nickname: users.nickname,
        avatar: users.avatar,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        tenantCode: userTenantBindings.tenantCode,
        agentId: userTenantBindings.agentId,
      })
      .from(users)
      .innerJoin(userTenantBindings, eq(users.id, userTenantBindings.userId))
      .innerJoin(tenants, eq(userTenantBindings.tenantCode, tenants.tenantCode))
      .where(and(
        eq(users.openid, this.input.openid),
        eq(userTenantBindings.tenantCode, this.input.tenantCode),
        eq(tenants.status, 'active'),
        isNull(userTenantBindings.unboundAt),
      ))
      .limit(1)

    return rows[0] ?? null
  }
}
