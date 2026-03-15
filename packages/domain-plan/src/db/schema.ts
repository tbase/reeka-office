import { sql } from 'drizzle-orm'
import {
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

import type {
  CheckinEvidence,
  PlanEnrollmentStatus,
  PlanStatus,
  PlanTaskCompletionMode,
  PlanTaskStatus,
  PlanTaskType,
} from '../domain/types'
import type { DomainEventPayload } from '../domain/events'

export const plans = mysqlTable('plans', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['draft', 'published', 'archived']).default('draft').$type<PlanStatus>().notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
}, (t) => [
  uniqueIndex('plans_name_udx').on(t.name),
])

export const planStages = mysqlTable('plan_stages', {
  id: int('id').autoincrement().primaryKey(),
  planId: int('plan_id').notNull().references(() => plans.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
}, (t) => [
  index('plan_stages_plan_order_idx').on(t.planId, t.displayOrder),
])

export const planTaskCategories = mysqlTable('plan_task_categories', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  displayOrder: int('display_order').notNull().default(0),
  isActive: int('is_active').notNull().default(1).$type<boolean>(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
}, (t) => [
  uniqueIndex('plan_task_categories_name_udx').on(t.name),
  index('plan_task_categories_active_order_idx').on(t.isActive, t.displayOrder),
])

export const planTasks = mysqlTable('plan_tasks', {
  id: int('id').autoincrement().primaryKey(),
  planId: int('plan_id').notNull().references(() => plans.id),
  stageId: int('stage_id').notNull().references(() => planStages.id),
  categoryId: int('category_id').notNull().references(() => planTaskCategories.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  displayOrder: int('display_order').notNull().default(0),
  taskType: mysqlEnum('task_type', ['normal', 'metric']).default('normal').$type<PlanTaskType>().notNull(),
  isRequired: int('is_required').notNull().default(0).$type<boolean>(),
  status: mysqlEnum('status', ['active', 'archived']).default('active').$type<PlanTaskStatus>().notNull(),
  pointItemId: int('point_item_id'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
}, (t) => [
  index('plan_tasks_plan_stage_order_idx').on(t.planId, t.stageId, t.displayOrder),
  index('plan_tasks_category_idx').on(t.categoryId),
  index('plan_tasks_point_item_idx').on(t.pointItemId),
])

export const planEnrollments = mysqlTable('plan_enrollments', {
  id: int('id').autoincrement().primaryKey(),
  planId: int('plan_id').notNull().references(() => plans.id),
  agentCode: varchar('agent_code', { length: 8 }).notNull(),
  status: mysqlEnum('status', ['active', 'eligible', 'graduated', 'cancelled'])
    .default('active')
    .$type<PlanEnrollmentStatus>()
    .notNull(),
  assignedAt: timestamp('assigned_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  startedAt: timestamp('started_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  eligibleAt: timestamp('eligible_at'),
  graduatedAt: timestamp('graduated_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
}, (t) => [
  uniqueIndex('plan_enrollments_plan_agent_udx').on(t.planId, t.agentCode),
  index('plan_enrollments_plan_status_idx').on(t.planId, t.status),
  index('plan_enrollments_agent_status_idx').on(t.agentCode, t.status),
])

export const planCompletedTasks = mysqlTable('plan_completed_tasks', {
  id: int('id').autoincrement().primaryKey(),
  enrollmentId: int('enrollment_id').notNull().references(() => planEnrollments.id),
  taskId: int('task_id').notNull().references(() => planTasks.id),
  completionMode: mysqlEnum('completion_mode', ['checkin', 'metric'])
    .$type<PlanTaskCompletionMode>()
    .notNull(),
  completedAt: timestamp('completed_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  evidenceJson: json('evidence_json').$type<CheckinEvidence | null>(),
  remark: text('remark'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  uniqueIndex('plan_completed_tasks_enrollment_task_udx').on(t.enrollmentId, t.taskId),
  index('plan_completed_tasks_task_idx').on(t.taskId),
])

export const planDomainEvents = mysqlTable('plan_domain_events', {
  id: int('id').autoincrement().primaryKey(),
  aggregateType: varchar('aggregate_type', { length: 50 }).notNull(),
  aggregateId: int('aggregate_id').notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: json('payload').$type<DomainEventPayload>().notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('plan_domain_events_aggregate_idx').on(t.aggregateType, t.aggregateId),
  index('plan_domain_events_type_idx').on(t.eventType),
])

export type PlanRow = typeof plans.$inferSelect
export type NewPlanRow = typeof plans.$inferInsert
export type PlanStageRow = typeof planStages.$inferSelect
export type NewPlanStageRow = typeof planStages.$inferInsert
export type PlanTaskCategoryRow = typeof planTaskCategories.$inferSelect
export type NewPlanTaskCategoryRow = typeof planTaskCategories.$inferInsert
export type PlanTaskRow = typeof planTasks.$inferSelect
export type NewPlanTaskRow = typeof planTasks.$inferInsert
export type PlanEnrollmentRow = typeof planEnrollments.$inferSelect
export type NewPlanEnrollmentRow = typeof planEnrollments.$inferInsert
export type PlanCompletedTaskRow = typeof planCompletedTasks.$inferSelect
export type NewPlanCompletedTaskRow = typeof planCompletedTasks.$inferInsert
export type PlanDomainEventRow = typeof planDomainEvents.$inferSelect
export type NewPlanDomainEventRow = typeof planDomainEvents.$inferInsert
