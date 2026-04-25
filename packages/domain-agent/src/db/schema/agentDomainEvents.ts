import { sql } from 'drizzle-orm'
import {
  datetime,
  index,
  int,
  json,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core'

export const agentDomainEvents = mysqlTable('agent_domain_events', {
  id: int('id').primaryKey().autoincrement(),
  aggregateType: varchar('aggregate_type', { length: 50 }).notNull(),
  aggregateId: varchar('aggregate_id', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: json('payload').$type<Record<string, unknown>>().notNull(),
  occurredAt: datetime('occurred_at').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('agent_domain_events_aggregate_idx').on(table.aggregateType, table.aggregateId),
  index('agent_domain_events_occurred_idx').on(table.occurredAt),
])

export type AgentDomainEventRow = typeof agentDomainEvents.$inferSelect
export type NewAgentDomainEventRow = typeof agentDomainEvents.$inferInsert
