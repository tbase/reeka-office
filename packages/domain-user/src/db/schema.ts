import { sql } from "drizzle-orm"
import {
  date,
  datetime,
  foreignKey,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core"

export const tenants = mysqlTable('tenants', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['active', 'inactive']).default('active').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
})

export const agents = mysqlTable('agents', {
  id: int('id').primaryKey().autoincrement(),
  tenantId: int('tenant_id').notNull().references(() => tenants.id),
  agentCode: varchar('agent_code', { length: 8 }).unique(),
  name: varchar('name', { length: 100 }).notNull(),
  joinDate: date('join_date', { mode: 'string' }),
  designation: int('designation'),
  finacingScheme: json('finacing_scheme').$type<string[] | null>(),
  leaderCode: varchar('leader_code', { length: 8 }),
  lastPromotionDate: date('last_promotion_date', { mode: 'string' }),
  agency: varchar('agency', { length: 100 }),
  division: varchar('division', { length: 100 }),
  branch: varchar('branch', { length: 100 }),
  unit: varchar('unit', { length: 100 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (t) => [
  uniqueIndex('agents_tenant_code_udx').on(t.tenantId, t.agentCode),
  foreignKey({
    name: 'agents_leader_code_fk',
    columns: [t.leaderCode],
    foreignColumns: [t.agentCode],
  }).onDelete('no action'),
])

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  openid: varchar('openid', { length: 100 }).notNull().unique(),
  nickname: varchar('nickname', { length: 64 }),
  avatar: varchar('avatar', { length: 500 }),
  role: mysqlEnum('role', ['agent', 'admin']).default('agent').notNull(),
  agentId: int('agent_id').unique().references(() => agents.id),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
})
