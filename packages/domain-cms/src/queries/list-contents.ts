import { and, count, desc, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, contents, type ContentRow } from "../schema";

export interface ListContentsInput {
  categoryId?: number;
  categorySlug?: string;
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
  private readonly input: ListContentsInput;

  constructor(input: ListContentsInput = {}) {
    this.db = getDb();
    this.input = input;
  }

  async query(): Promise<ListContentsResult> {
    const filters = [
      typeof this.input.categoryId === "number" ? eq(contents.categoryId, this.input.categoryId) : undefined,
      this.input.categorySlug?.trim() ? eq(categories.slug, this.input.categorySlug.trim()) : undefined,
    ].filter((item) => item !== undefined);

    const whereClause = filters.length === 0
      ? undefined
      : filters.length === 1
        ? filters[0]
        : and(...filters);

    const [contentRows, totalRows] = await Promise.all([
      this.db
        .select({
          id: contents.id,
          categoryId: contents.categoryId,
          categoryName: categories.name,
          name: contents.name,
          content: contents.content,
          fields: contents.fields,
          createdAt: contents.createdAt,
          updatedAt: contents.updatedAt
        })
        .from(contents)
        .innerJoin(categories, eq(categories.id, contents.categoryId))
        .where(whereClause)
        .orderBy(desc(contents.createdAt)),
      this.db
        .select({ value: count() })
        .from(contents)
        .innerJoin(categories, eq(categories.id, contents.categoryId))
        .where(whereClause)
    ]);

    return {
      contents: contentRows,
      total: Number(totalRows[0]?.value ?? 0)
    };
  }
}
