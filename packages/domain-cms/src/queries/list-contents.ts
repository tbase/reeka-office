import { and, count, desc, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, contents, type ContentRow } from "../schema";
import type { TenantScope } from "../scope";

export interface ListContentsInput {
  categoryId?: number;
}

export interface ListContentItem extends ContentRow {
  categoryName: string;
}

export interface ListContentsResult {
  contents: ListContentItem[];
  total: number;
}

export class ListContentsQuery {
  private readonly db: DB;
  private readonly scope: TenantScope;
  private readonly input: ListContentsInput;

  constructor(
    scope: TenantScope,
    input: ListContentsInput = {},
  ) {
    this.db = getDb();
    this.scope = scope;
    this.input = input;
  }

  async query(): Promise<ListContentsResult> {
    const filters = [
      eq(contents.tenantId, this.scope.tenantId),
      this.input.categoryId ? eq(contents.categoryId, this.input.categoryId) : undefined,
    ].filter((item) => item !== undefined);

    const whereClause = filters.length === 1 ? filters[0] : and(...filters);

    const [contentRows, totalRows] = await Promise.all([
      this.db
        .select({
          id: contents.id,
          tenantId: contents.tenantId,
          categoryId: contents.categoryId,
          categoryName: categories.name,
          name: contents.name,
          content: contents.content,
          fields: contents.fields,
          createdAt: contents.createdAt,
          updatedAt: contents.updatedAt
        })
        .from(contents)
        .innerJoin(categories, and(
          eq(categories.id, contents.categoryId),
          eq(categories.tenantId, this.scope.tenantId),
        ))
        .where(whereClause)
        .orderBy(desc(contents.createdAt)),
      this.db.select({ value: count() }).from(contents).where(whereClause)
    ]);

    return {
      contents: contentRows,
      total: Number(totalRows[0]?.value ?? 0)
    };
  }
}

export interface ListContentsByCategoryInput {
  categoryId: number;
}

export class ListContentsByCategoryQuery {
  private readonly scope: TenantScope;
  private readonly input: ListContentsByCategoryInput;

  constructor(
    scope: TenantScope,
    input: ListContentsByCategoryInput,
  ) {
    this.scope = scope;
    this.input = input;
  }

  async query(): Promise<ListContentsResult> {
    return new ListContentsQuery(this.scope, {
      categoryId: this.input.categoryId,
    }).query();
  }
}
