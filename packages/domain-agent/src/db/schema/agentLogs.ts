import { sql } from 'drizzle-orm'
import {
  datetime,
  foreignKey,
  index,
  int,
  json,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core'

import { agents } from './agents'

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

export type AgentLogRow = typeof agentLogs.$inferSelect
export type NewAgentLogRow = typeof agentLogs.$inferInsert
