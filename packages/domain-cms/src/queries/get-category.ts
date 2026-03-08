import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, type CategoryRow } from "../schema";

export interface GetCategoryInput {
  id?: number;
  slug?: string;
}

export class GetCategoryQuery {
  private readonly db: DB;
  constructor(private readonly input: GetCategoryInput) {
    this.db = getDb();
  }

  async query(): Promise<CategoryRow | null> {
    if (typeof this.input.id !== "number" && !this.input.slug?.trim()) {
      throw new Error("GetCategoryQuery requires either id or slug.");
    }

    const whereClause = typeof this.input.id === "number"
      ? eq(categories.id, this.input.id)
      : eq(categories.slug, this.input.slug!.trim());

    const rows = await this.db
      .select()
      .from(categories)
      .where(whereClause)
      .limit(1);
    return rows[0] ?? null;
  }
}
