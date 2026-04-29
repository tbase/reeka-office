import { sql } from 'drizzle-orm'
import {
  datetime,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

export const tenants = mysqlTable('tenants', {
  tenantCode: varchar('tenant_code', { length: 32 }).primaryKey(),
  tenantName: varchar('tenant_name', { length: 100 }).notNull(),
  adminDomain: varchar('admin_domain', { length: 255 }).notNull(),
  apiServiceName: varchar('api_service_name', { length: 100 }).notNull(),
  status: mysqlEnum('status', ['active', 'disabled']).default('active').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex('tenants_admin_domain_idx').on(table.adminDomain),
  uniqueIndex('tenants_api_service_name_idx').on(table.apiServiceName),
])

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  openid: varchar('openid', { length: 100 }).notNull().unique(),
  nickname: varchar('nickname', { length: 64 }),
  avatar: varchar('avatar', { length: 500 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
})

export const userTenantBindings = mysqlTable('user_tenant_bindings', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id),
  tenantCode: varchar('tenant_code', { length: 32 }).notNull().references(() => tenants.tenantCode),
  agentId: int('agent_id').notNull(),
  boundAt: datetime('bound_at').default(sql`CURRENT_TIMESTAMP`),
  unboundAt: datetime('unbound_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex('user_tenant_bindings_agent_idx').on(table.tenantCode, table.agentId),
  uniqueIndex('user_tenant_bindings_user_tenant_idx').on(table.userId, table.tenantCode),
])

export const bindingTokens = mysqlTable('binding_tokens', {
  token: varchar('token', { length: 16 }).primaryKey(),
  tenantCode: varchar('tenant_code', { length: 32 }).notNull(),
  agentId: int('agent_id').notNull(),
  expiresAt: datetime('expires_at').notNull(),
  boundAt: datetime('bound_at'),
  boundUserId: int('bound_user_id'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  foreignKey({
    name: 'binding_tokens_tenant_code_fk',
    columns: [table.tenantCode],
    foreignColumns: [tenants.tenantCode],
  }).onDelete('cascade'),
  foreignKey({
    name: 'binding_tokens_bound_user_id_fk',
    columns: [table.boundUserId],
    foreignColumns: [users.id],
  }).onDelete('set null'),
])

export const inviteShareTokens = mysqlTable('invite_share_tokens', {
  token: varchar('token', { length: 96 }).primaryKey(),
  tenantCode: varchar('tenant_code', { length: 32 }).notNull(),
  inviterAgentId: int('inviter_agent_id').notNull(),
  inviterAgentCode: varchar('inviter_agent_code', { length: 8 }).notNull(),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('invite_share_tokens_inviter_idx').on(table.tenantCode, table.inviterAgentId),
  foreignKey({
    name: 'invite_share_tokens_tenant_code_fk',
    columns: [table.tenantCode],
    foreignColumns: [tenants.tenantCode],
  }).onDelete('cascade'),
])
