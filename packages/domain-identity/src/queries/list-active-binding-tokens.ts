import { and, eq, gt, inArray, isNull } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import { getDb, type DB, type IdentitySchema } from '../context'
import { bindingTokens } from '../db/schema'

export interface ActiveBindingToken {
  token: string
  tenantCode: string
  agentId: number
  expiresAt: Date
  boundAt: Date | null
  boundUserId: number | null
}

export interface ListActiveBindingTokensInput {
  tenantCode: string
  agentIds?: number[]
  db?: MySql2Database<IdentitySchema>
}

export type ListActiveBindingTokensResult = ActiveBindingToken[]

export class ListActiveBindingTokensQuery {
  private readonly db: DB | MySql2Database<IdentitySchema>
  private readonly input: ListActiveBindingTokensInput

  constructor(input: ListActiveBindingTokensInput) {
    this.input = input
    this.db = input.db ?? getDb()
  }

  async query(): Promise<ListActiveBindingTokensResult> {
    const tenantCode = this.input.tenantCode.trim()
    if (!tenantCode) {
      throw new Error('租户编码不能为空')
    }

    const agentIds = [...new Set((this.input.agentIds ?? []).filter((value) => Number.isInteger(value) && value > 0))]
    if (this.input.agentIds && agentIds.length === 0) {
      return []
    }

    const conditions = [
      eq(bindingTokens.tenantCode, tenantCode),
      gt(bindingTokens.expiresAt, new Date()),
      isNull(bindingTokens.boundAt),
      isNull(bindingTokens.boundUserId),
    ]

    if (agentIds.length > 0) {
      conditions.push(inArray(bindingTokens.agentId, agentIds))
    }

    return this.db
      .select({
        token: bindingTokens.token,
        tenantCode: bindingTokens.tenantCode,
        agentId: bindingTokens.agentId,
        expiresAt: bindingTokens.expiresAt,
        boundAt: bindingTokens.boundAt,
        boundUserId: bindingTokens.boundUserId,
      })
      .from(bindingTokens)
      .where(and(...conditions))
  }
}
