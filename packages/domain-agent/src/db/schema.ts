import { sql } from "drizzle-orm"
import {
  date,
  datetime,
  foreignKey,
  int,
  json,
  mysqlTable,
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
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (t) => [
  foreignKey({
    name: 'agents_leader_code_fk',
    columns: [t.leaderCode],
    foreignColumns: [t.agentCode],
  }).onDelete('no action'),
])
