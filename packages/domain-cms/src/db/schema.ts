import { int, json, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm/sql/sql";

export type FieldSchemaItem = {
  name: string;
  label: string;
  type: "text" | "textarea" | "image" | "number" | "date" | "select" | "switch";
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type ContentFields = Record<string, unknown>;

export const categories = mysqlTable("cms_categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fieldSchema: json("field_schema").$type<FieldSchemaItem[]>().notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull()
});

export const contents = mysqlTable("cms_contents", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id")
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  fields: json("fields").$type<ContentFields>().notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull()
});

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
export type ContentRow = typeof contents.$inferSelect;
export type NewContentRow = typeof contents.$inferInsert;
