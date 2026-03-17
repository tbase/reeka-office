import { datetime, int, json, mysqlTable, text, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm/sql/sql";

type FieldSchemaItemBase = {
  name: string;
  label: string;
  required?: boolean;
};

export type FieldSchemaItemCommon = FieldSchemaItemBase & {
  type: "text" | "textarea" | "number" | "date" | "switch";
  placeholder?: string;
};

export type FieldSchemaItemImage = FieldSchemaItemBase & {
  type: "image";
  props?: {
    multiple?: boolean;
  };
};

export type FieldSchemaItemOptions = FieldSchemaItemBase & {
  type: "options";
  props: {
    options: string[];
    multiple?: boolean;
  };
};

export type FieldSchemaItem = FieldSchemaItemCommon | FieldSchemaItemImage | FieldSchemaItemOptions;

export type ContentFields = Record<string, unknown>;

export const categories = mysqlTable("cms_categories", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  hideContent: int("hide_content").default(0).$type<boolean>().notNull(),
  fieldSchema: json("field_schema").$type<FieldSchemaItem[]>().notNull(),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull()
}, (t) => [
  uniqueIndex("cms_categories_tenant_slug_udx").on(t.tenantId, t.slug),
]);

export const contents = mysqlTable("cms_contents", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull(),
  categoryId: int("category_id")
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  fields: json("fields").$type<ContentFields>().notNull(),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`).notNull()
});

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
export type ContentRow = typeof contents.$inferSelect;
export type NewContentRow = typeof contents.$inferInsert;
