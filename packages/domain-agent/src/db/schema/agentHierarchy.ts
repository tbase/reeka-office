import {
  foreignKey,
  int,
  mysqlTable,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

import { agents } from './agents'

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

export type AgentHierarchyRow = typeof agentHierarchy.$inferSelect
export type NewAgentHierarchyRow = typeof agentHierarchy.$inferInsert
