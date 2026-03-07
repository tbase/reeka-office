import { sql } from 'drizzle-orm'
import { index, int, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const newbieTaskStages = mysqlTable('newbie_task_stages', {
  id: int('id').autoincrement().primaryKey(),
  stage: varchar('stage', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
})

export const newbieTaskCategories = mysqlTable('newbie_task_categories', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
})

export const newbieTasks = mysqlTable('newbie_tasks', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  stageId: int('stage_id').notNull().references(() => newbieTaskStages.id),
  categoryId: int('category_id').notNull().references(() => newbieTaskCategories.id),
  displayOrder: int('display_order').notNull().default(0),
  pointEventId: int('point_event_id').notNull(),
  pointAmount: int('point_amount'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
}, (t) => [
  index('newbie_tasks_stage_idx').on(t.stageId),
  index('newbie_tasks_category_idx').on(t.categoryId),
])

export const newbieTaskCheckins = mysqlTable('newbie_task_checkins', {
  id: int('id').autoincrement().primaryKey(),
  agentCode: varchar('agent_code', { length: 8 }).notNull(),
  taskId: int('task_id').notNull().references(() => newbieTasks.id),
  evidence: text('evidence').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
}, (t) => [
  index('newbie_task_checkins_agent_idx').on(t.agentCode),
  index('newbie_task_checkins_task_idx').on(t.taskId),
  index('newbie_task_checkins_agent_task_idx').on(t.agentCode, t.taskId),
])

export type NewbieTaskStageRow = typeof newbieTaskStages.$inferSelect
export type NewNewbieTaskStageRow = typeof newbieTaskStages.$inferInsert
export type NewbieTaskCategoryRow = typeof newbieTaskCategories.$inferSelect
export type NewNewbieTaskCategoryRow = typeof newbieTaskCategories.$inferInsert
export type NewbieTaskRow = typeof newbieTasks.$inferSelect
export type NewNewbieTaskRow = typeof newbieTasks.$inferInsert
export type NewbieTaskCheckinRow = typeof newbieTaskCheckins.$inferSelect
export type NewNewbieTaskCheckinRow = typeof newbieTaskCheckins.$inferInsert
