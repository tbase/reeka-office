import { eq } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { inviteShareTokens, tenants } from '../db/schema'
import type { InviteShareTokenInfo } from '../types'

export interface ResolveInviteShareTokenInput {
  token: string
}

export type ResolveInviteShareTokenResult = InviteShareTokenInfo | null

export class ResolveInviteShareTokenQuery {
  private readonly db: DB
  private readonly input: ResolveInviteShareTokenInput

  constructor(input: ResolveInviteShareTokenInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ResolveInviteShareTokenResult> {
    const token = this.input.token.trim()
    if (!token) {
      return null
    }

    const rows = await this.db
      .select({
        token: inviteShareTokens.token,
        tenantCode: inviteShareTokens.tenantCode,
        tenantName: tenants.tenantName,
        apiServiceName: tenants.apiServiceName,
        inviterAgentId: inviteShareTokens.inviterAgentId,
        inviterAgentCode: inviteShareTokens.inviterAgentCode,
        expiresAt: inviteShareTokens.expiresAt,
        tenantStatus: tenants.status,
      })
      .from(inviteShareTokens)
      .innerJoin(tenants, eq(inviteShareTokens.tenantCode, tenants.tenantCode))
      .where(eq(inviteShareTokens.token, token))
      .limit(1)

    const row = rows[0]
    if (!row || row.tenantStatus !== 'active') {
      return null
    }

    return {
      token: row.token,
      tenantCode: row.tenantCode,
      tenantName: row.tenantName,
      apiServiceName: row.apiServiceName,
      inviterAgentId: row.inviterAgentId,
      inviterAgentCode: row.inviterAgentCode,
      expiresAt: row.expiresAt,
      isExpired: new Date(row.expiresAt).getTime() <= Date.now(),
    }
  }
}
