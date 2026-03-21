import { and, eq, isNull } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import { getDb, type DB, type IdentitySchema } from '../context'
import { tenants, userTenantBindings, users } from '../db/schema'
import type { UserTenant } from '../types'

export interface ListUserTenantsInput {
  openid: string
  db?: MySql2Database<IdentitySchema>
}

export type ListUserTenantsResult = UserTenant[]

export class ListUserTenantsQuery {
  private readonly db: DB | MySql2Database<IdentitySchema>
  private readonly input: ListUserTenantsInput

  constructor(input: ListUserTenantsInput) {
    this.input = input
    this.db = input.db ?? getDb()
  }

  async query(): Promise<ListUserTenantsResult> {
    const rows = await this.db
      .select({
        tenantCode: tenants.tenantCode,
        tenantName: tenants.tenantName,
        adminDomain: tenants.adminDomain,
        apiServiceName: tenants.apiServiceName,
        agentId: userTenantBindings.agentId,
        boundAt: userTenantBindings.boundAt,
      })
      .from(users)
      .innerJoin(userTenantBindings, eq(users.id, userTenantBindings.userId))
      .innerJoin(tenants, eq(userTenantBindings.tenantCode, tenants.tenantCode))
      .where(and(
        eq(users.openid, this.input.openid),
        eq(tenants.status, 'active'),
        isNull(userTenantBindings.unboundAt),
      ))

    return rows
  }
}
