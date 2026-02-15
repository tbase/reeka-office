import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, type CategoryRow } from "../schema";

export interface GetCategoryInput {
  id: number;
}

export class GetCategoryQuery {
  private readonly db: DB;
  constructor(private readonly input: GetCategoryInput) {
    this.db = getDb();
  }

  async query(): Promise<CategoryRow | null> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, this.input.id))
      .limit(1);
    return rows[0] ?? null;
  }
}
