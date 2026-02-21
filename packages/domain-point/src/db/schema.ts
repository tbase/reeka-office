import { sql } from 'drizzle-orm'
import {
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
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
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
}, (t) => [
  index('point_items_category_idx').on(t.category),
])

export const pointRecords = mysqlTable('point_records', {
  id: int('id').autoincrement().primaryKey(),
  agentCode: varchar('agent_code', { length: 8 }).notNull(),
  pointItemId: int('point_item_id').notNull().references(() => pointItems.id),
  points: int('points').notNull(),
  occurredYear: int('occurred_year').notNull(),
  remark: text('remark'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('point_records_agent_created_idx').on(t.agentCode, t.createdAt),
  index('point_records_limit_check_idx').on(t.agentCode, t.pointItemId, t.occurredYear),
])

export const agentPointBalances = mysqlTable('agent_point_balances', {
  agentCode: varchar('agent_code', { length: 8 }).primaryKey(),
  currentPoints: int('current_points').notNull().default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
})

export const redemptionProducts = mysqlTable('redemption_products', {
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
  validUntil: datetime('valid_until'),
  publishedAt: datetime('published_at'),
  offShelfAt: datetime('off_shelf_at'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
}, (t) => [
  index('redemption_products_status_idx').on(t.status),
  index('redemption_products_valid_until_idx').on(t.validUntil),
])

export const redemptionRecords = mysqlTable('redemption_records', {
  id: int('id').autoincrement().primaryKey(),
  productId: int('product_id').notNull().references(() => redemptionProducts.id),
  agentCode: varchar('agent_code', { length: 8 }).notNull(),
  pointsCost: int('points_cost').notNull(),
  status: mysqlEnum('status', ['success', 'cancelled']).default('success').notNull(),
  remark: text('remark'),
  redeemedAt: timestamp('redeemed_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('redemption_records_agent_time_idx').on(t.agentCode, t.redeemedAt),
  index('redemption_records_agent_product_idx').on(t.agentCode, t.productId),
  index('redemption_records_product_time_idx').on(t.productId, t.redeemedAt),
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
