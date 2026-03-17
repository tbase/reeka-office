import { desc, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, type CategoryRow } from "../schema";
import type { TenantScope } from "../scope";

export type ListCategoriesInput = Record<string, never>;

export class ListCategoriesQuery {
  private readonly db: DB;
  private readonly scope: TenantScope;

  constructor(
    scope: TenantScope,
    _input: ListCategoriesInput = {},
  ) {
    this.db = getDb();
    this.scope = scope;
  }

  async query(): Promise<CategoryRow[]> {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, this.scope.tenantId))
      .orderBy(desc(categories.createdAt));
  }
}
