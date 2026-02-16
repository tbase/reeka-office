import { count, desc, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, contents, type ContentRow } from "../schema";

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
  constructor(private readonly input: ListContentsInput = {}) {
    this.db = getDb();
  }

  async query(): Promise<ListContentsResult> {
    const whereClause = this.input.categoryId
      ? eq(contents.categoryId, this.input.categoryId)
      : undefined;

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
  constructor(private readonly input: ListContentsByCategoryInput) {}

  async query(): Promise<ListContentsResult> {
    return new ListContentsQuery({ categoryId: this.input.categoryId }).query();
  }
}
