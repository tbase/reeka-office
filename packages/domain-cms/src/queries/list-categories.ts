import { desc } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, type CategoryRow } from "../schema";

export class ListCategoriesQuery {
  private readonly db: DB;

  constructor() {
    this.db = getDb();
  }

  async query(): Promise<CategoryRow[]> {
    return this.db.select().from(categories).orderBy(desc(categories.createdAt));
  }
}
