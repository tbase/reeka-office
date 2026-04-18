import { and, eq, inArray, isNull } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import { getDb, type DB, type IdentitySchema } from '../context'
import { userTenantBindings } from '../db/schema'

export interface ActiveTenantAgentBinding {
  agentId: number
  boundAt: Date | null
}

export interface ListActiveTenantAgentBindingsInput {
  tenantCode: string
  agentIds?: number[]
  db?: MySql2Database<IdentitySchema>
}

export type ListActiveTenantAgentBindingsResult = ActiveTenantAgentBinding[]

export class ListActiveTenantAgentBindingsQuery {
  private readonly db: DB | MySql2Database<IdentitySchema>
  private readonly input: ListActiveTenantAgentBindingsInput

  constructor(input: ListActiveTenantAgentBindingsInput) {
    this.input = input
    this.db = input.db ?? getDb()
  }

  async query(): Promise<ListActiveTenantAgentBindingsResult> {
    const tenantCode = this.input.tenantCode.trim()
    if (!tenantCode) {
      throw new Error('租户编码不能为空')
    }

    const agentIds = [...new Set((this.input.agentIds ?? []).filter((value) => Number.isInteger(value) && value > 0))]
    if (this.input.agentIds && agentIds.length === 0) {
      return []
    }

    const conditions = [
      eq(userTenantBindings.tenantCode, tenantCode),
      isNull(userTenantBindings.unboundAt),
    ]

    if (agentIds.length > 0) {
      conditions.push(inArray(userTenantBindings.agentId, agentIds))
    }

    return this.db
      .select({
        agentId: userTenantBindings.agentId,
        boundAt: userTenantBindings.boundAt,
      })
      .from(userTenantBindings)
      .where(and(...conditions))
  }
}
