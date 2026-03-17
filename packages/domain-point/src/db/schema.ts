import { sql } from 'drizzle-orm'
import {
  datetime,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

export type PointItemStandard = Record<string, unknown>

export const pointItems = mysqlTable('point_items', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  pointAmount: int('point_amount'),
  annualLimit: int('annual_limit'),
  standard: json('standard').$type<PointItemStandard | null>(),
  createdBy: int('created_by').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('point_items_category_idx').on(t.category),
])

export const pointRecords = mysqlTable('point_records', {
  id: int('id').autoincrement().primaryKey(),
  agentId: int('agent_id').notNull(),
  pointItemId: int('point_item_id').notNull().references(() => pointItems.id),
  points: int('points').notNull(),
  occurredYear: int('occurred_year').notNull(),
  sourceType: varchar('source_type', { length: 100 }),
  sourceRef: varchar('source_ref', { length: 100 }),
  remark: text('remark'),
  createdBy: int('created_by').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('point_records_agent_created_idx').on(t.agentId, t.createdAt),
  index('point_records_limit_check_idx').on(t.agentId, t.pointItemId, t.occurredYear),
  uniqueIndex('point_records_source_udx').on(t.sourceType, t.sourceRef),
])

export const agentPointBalances = mysqlTable('point_agent_balances', {
  agentId: int('agent_id').primaryKey(),
  currentPoints: int('current_points').notNull().default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('point_agent_balances_points_idx').on(t.currentPoints),
])

export const redemptionProducts = mysqlTable('point_redemption_products', {
  id: int('id').autoincrement().primaryKey(),
  redeemCategory: varchar('redeem_category', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  notice: text('notice'),
  status: mysqlEnum('status', ['draft', 'published', 'off_shelf']).default('draft').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  stock: int('stock').notNull().default(0),
  redeemPoints: int('redeem_points').notNull(),
  maxRedeemPerAgent: int('max_redeem_per_agent').notNull().default(1),
  validPeriodMonths: int('valid_period_months'),
  publishedAt: datetime('published_at'),
  offShelfAt: datetime('off_shelf_at'),
  createdBy: int('created_by').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('point_redemption_products_status_idx').on(t.status),
  index('point_redemption_products_valid_period_idx').on(t.validPeriodMonths),
])

export const redemptionRecords = mysqlTable('point_redemption_records', {
  id: int('id').autoincrement().primaryKey(),
  productId: int('product_id').notNull(),
  agentId: int('agent_id').notNull(),
  pointsCost: int('points_cost').notNull(),
  status: mysqlEnum('status', ['success', 'cancelled']).default('success').notNull(),
  remark: text('remark'),
  redeemedAt: datetime('redeemed_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  foreignKey({
    name: 'point_redemption_records_product_fk',
    columns: [t.productId],
    foreignColumns: [redemptionProducts.id],
  }),
  index('point_redemption_records_agent_time_idx').on(t.agentId, t.redeemedAt),
  index('point_redemption_records_agent_product_idx').on(t.agentId, t.productId),
  index('point_redemption_records_product_time_idx').on(t.productId, t.redeemedAt),
])

export type PointItemRow = typeof pointItems.$inferSelect
export type NewPointItemRow = typeof pointItems.$inferInsert
export type PointRecordRow = typeof pointRecords.$inferSelect
export type NewPointRecordRow = typeof pointRecords.$inferInsert
export type AgentPointBalanceRow = typeof agentPointBalances.$inferSelect
export type NewAgentPointBalanceRow = typeof agentPointBalances.$inferInsert
export type RedemptionProductRow = typeof redemptionProducts.$inferSelect
export type NewRedemptionProductRow = typeof redemptionProducts.$inferInsert
export type RedemptionRecordRow = typeof redemptionRecords.$inferSelect
export type NewRedemptionRecordRow = typeof redemptionRecords.$inferInsert
