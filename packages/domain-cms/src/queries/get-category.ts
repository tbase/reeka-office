import { and, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, type CategoryRow } from "../schema";
import type { TenantScope } from "../scope";

export interface GetCategoryInput {
  id?: number;
  slug?: string;
}

export class GetCategoryQuery {
  private readonly db: DB;
  private readonly scope: TenantScope;
  private readonly input: GetCategoryInput;

  constructor(
    scope: TenantScope,
    input: GetCategoryInput,
  ) {
    this.db = getDb();
    this.scope = scope;
    this.input = input;
  }

  async query(): Promise<CategoryRow | null> {
    if (typeof this.input.id !== "number" && !this.input.slug?.trim()) {
      throw new Error("GetCategoryQuery requires either id or slug.");
    }

    const whereClause = typeof this.input.id === "number"
      ? and(
        eq(categories.tenantId, this.scope.tenantId),
        eq(categories.id, this.input.id),
      )
      : and(
        eq(categories.tenantId, this.scope.tenantId),
        eq(categories.slug, this.input.slug!.trim()),
      );

    const rows = await this.db
      .select()
      .from(categories)
      .where(whereClause)
      .limit(1);
    return rows[0] ?? null;
  }
}
