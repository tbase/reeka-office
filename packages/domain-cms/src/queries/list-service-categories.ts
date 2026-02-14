import { desc } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { serviceCategories, type ServiceCategoryRow } from "../schema";

export class ListServiceCategoriesQuery {
  private readonly db: DB;

  constructor() {
    this.db = getDb();
  }

  async query(): Promise<ServiceCategoryRow[]> {
    return this.db.select().from(serviceCategories).orderBy(desc(serviceCategories.createdAt));
  }
}
