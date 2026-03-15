import { sql } from "drizzle-orm"
import { date, int, mysqlEnum, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core"

export const agents = mysqlTable('agents', {
  id: int('id').primaryKey().autoincrement(),
  agentCode: varchar('agent_code', { length: 8 }).unique(),
  name: varchar('name', { length: 100 }).notNull(),
  joinDate: date('join_date', { mode: 'string' }),
  designation: varchar('designation', { length: 100 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  openid: varchar('openid', { length: 100 }).notNull().unique(),
  nickname: varchar('nickname', { length: 64 }),
  avatar: varchar('avatar', { length: 500 }),
  role: mysqlEnum('role', ['agent', 'admin']).default('agent').notNull(),
  agentId: int('agent_id').unique().references(() => agents.id),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})
