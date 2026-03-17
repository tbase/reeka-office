import { desc } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, type CategoryRow } from "../schema";

export type ListCategoriesInput = Record<string, never>;

export class ListCategoriesQuery {
  private readonly db: DB;

  constructor(_input: ListCategoriesInput = {}) {
    this.db = getDb();
  }

  async query(): Promise<CategoryRow[]> {
    return this.db
      .select()
      .from(categories)
      .orderBy(desc(categories.createdAt));
  }
}
