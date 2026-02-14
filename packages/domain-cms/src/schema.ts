import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const serviceCategories = mysqlTable("service_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const serviceItems = mysqlTable("service_items", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id")
    .notNull()
    .references(() => serviceCategories.id),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  wechatId: varchar("wechat_id", { length: 100 }),
  wechatQrCode: text("wechat_qr_code"),
  contactName: varchar("contact_name", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type ServiceCategoryRow = typeof serviceCategories.$inferSelect;
export type NewServiceCategoryRow = typeof serviceCategories.$inferInsert;
export type ServiceItemRow = typeof serviceItems.$inferSelect;
export type NewServiceItemRow = typeof serviceItems.$inferInsert;
