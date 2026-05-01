import { sql } from 'drizzle-orm'
import {
  datetime,
  foreignKey,
  index,
  int,
  json,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core'

export const crmCustomerTypes = mysqlTable('crm_customer_types', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  enabled: int('enabled').notNull().default(1).$type<boolean>(),
  supportsOpportunity: int('supports_opportunity').notNull().default(0).$type<boolean>(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('crm_customer_types_enabled_order_idx').on(table.enabled, table.sortOrder),
])

export const crmProfileFields = mysqlTable('crm_profile_fields', {
  id: int('id').autoincrement().primaryKey(),
  customerTypeId: int('customer_type_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  enabled: int('enabled').notNull().default(1).$type<boolean>(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  foreignKey({
    name: 'crm_profile_fields_customer_type_fk',
    columns: [table.customerTypeId],
    foreignColumns: [crmCustomerTypes.id],
  }).onDelete('no action'),
  index('crm_profile_fields_type_order_idx').on(table.customerTypeId, table.sortOrder),
])

export const crmCustomers = mysqlTable('crm_customers', {
  id: int('id').autoincrement().primaryKey(),
  agentId: int('agent_id').notNull(),
  customerTypeId: int('customer_type_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  gender: varchar('gender', { length: 1 }).$type<'M' | 'F' | null>(),
  birthday: varchar('birthday', { length: 10 }),
  city: varchar('city', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  wechat: varchar('wechat', { length: 100 }),
  tags: json('tags').$type<string[]>().notNull(),
  note: text('note'),
  archivedAt: datetime('archived_at'),
  lastFollowedAt: datetime('last_followed_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  foreignKey({
    name: 'crm_customers_customer_type_fk',
    columns: [table.customerTypeId],
    foreignColumns: [crmCustomerTypes.id],
  }).onDelete('no action'),
  index('crm_customers_agent_archive_follow_idx').on(table.agentId, table.archivedAt, table.lastFollowedAt),
  index('crm_customers_agent_type_phone_idx').on(table.agentId, table.customerTypeId, table.phone),
  index('crm_customers_agent_type_wechat_idx').on(table.agentId, table.customerTypeId, table.wechat),
])

export const crmCustomerProfileValues = mysqlTable('crm_customer_profile_values', {
  id: int('id').autoincrement().primaryKey(),
  agentId: int('agent_id').notNull(),
  customerId: int('customer_id').notNull(),
  customerTypeId: int('customer_type_id').notNull(),
  fieldId: int('field_id').notNull(),
  value: text('value').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  foreignKey({
    name: 'crm_profile_values_customer_fk',
    columns: [table.customerId],
    foreignColumns: [crmCustomers.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'crm_profile_values_type_fk',
    columns: [table.customerTypeId],
    foreignColumns: [crmCustomerTypes.id],
  }).onDelete('no action'),
  foreignKey({
    name: 'crm_profile_values_field_fk',
    columns: [table.fieldId],
    foreignColumns: [crmProfileFields.id],
  }).onDelete('no action'),
  index('crm_profile_values_customer_type_idx').on(table.customerId, table.customerTypeId),
  index('crm_profile_values_agent_field_idx').on(table.agentId, table.fieldId),
])

export const crmFollowUpRecords = mysqlTable('crm_follow_up_records', {
  id: int('id').autoincrement().primaryKey(),
  agentId: int('agent_id').notNull(),
  customerId: int('customer_id').notNull(),
  customerTypeId: int('customer_type_id').notNull(),
  method: varchar('method', { length: 20 }).$type<'face' | 'phone' | 'wechat' | 'other' | null>(),
  followedAt: datetime('followed_at').notNull(),
  content: text('content').notNull(),
  analysisStatus: varchar('analysis_status', { length: 20 }).notNull().default('pending').$type<'pending' | 'analyzed'>(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  foreignKey({
    name: 'crm_follow_up_records_customer_fk',
    columns: [table.customerId],
    foreignColumns: [crmCustomers.id],
  }).onDelete('cascade'),
  index('crm_follow_up_records_customer_time_idx').on(table.customerId, table.followedAt),
  index('crm_follow_up_records_agent_time_idx').on(table.agentId, table.followedAt),
])

export type CrmCustomerTypeRow = typeof crmCustomerTypes.$inferSelect
export type NewCrmCustomerTypeRow = typeof crmCustomerTypes.$inferInsert
export type CrmProfileFieldRow = typeof crmProfileFields.$inferSelect
export type NewCrmProfileFieldRow = typeof crmProfileFields.$inferInsert
export type CrmCustomerRow = typeof crmCustomers.$inferSelect
export type NewCrmCustomerRow = typeof crmCustomers.$inferInsert
export type CrmCustomerProfileValueRow = typeof crmCustomerProfileValues.$inferSelect
export type NewCrmCustomerProfileValueRow = typeof crmCustomerProfileValues.$inferInsert
export type CrmFollowUpRecordRow = typeof crmFollowUpRecords.$inferSelect
export type NewCrmFollowUpRecordRow = typeof crmFollowUpRecords.$inferInsert
