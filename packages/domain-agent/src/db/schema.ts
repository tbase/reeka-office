import { sql } from "drizzle-orm"
import {
  date,
  datetime,
  foreignKey,
  index,
  int,
  json,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core"

export const agents = mysqlTable('agents', {
  id: int('id').primaryKey().autoincrement(),
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
  deletedAt: datetime('deleted_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (t) => [
  foreignKey({
    name: 'agents_leader_code_fk',
    columns: [t.leaderCode],
    foreignColumns: [t.agentCode],
  }).onDelete('no action'),
])

export const agentHierarchy = mysqlTable('agent_hierarchy', {
  id: int('id').primaryKey().autoincrement(),
  agentCode: varchar('agent_code', { length: 8 }),
  leaderCode: varchar('leader_code', { length: 8 }),
  hierarchy: int('hierarchy').notNull(),
}, (t) => [
  uniqueIndex('agent_hierarchy_agent_leader_udx').on(t.agentCode, t.leaderCode),
  foreignKey({
    name: 'agent_hierarchy_agent_code_fk',
    columns: [t.agentCode],
    foreignColumns: [agents.agentCode],
  }).onDelete('no action'),
  foreignKey({
    name: 'agent_hierarchy_leader_code_fk',
    columns: [t.leaderCode],
    foreignColumns: [agents.agentCode],
  }).onDelete('no action'),
])

export const agentLogs = mysqlTable('agent_logs', {
  id: int('id').primaryKey().autoincrement(),
  agentCode: varchar('agent_code', { length: 8 }).notNull(),
  category: varchar('category', { length: 32 }).notNull(),
  action: varchar('action', { length: 32 }).notNull(),
  periodYear: int('period_year'),
  periodMonth: int('period_month'),
  source: varchar('source', { length: 64 }).notNull(),
  changes: json('changes').$type<Array<{
    field: string
    before: string | number | boolean | string[] | null
    after: string | number | boolean | string[] | null
  }>>().notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  foreignKey({
    name: 'agent_logs_agent_code_fk',
    columns: [table.agentCode],
    foreignColumns: [agents.agentCode],
  }).onDelete('no action'),
  index('agent_logs_agent_created_idx').on(table.agentCode, table.createdAt),
])
