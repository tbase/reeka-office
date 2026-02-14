import { desc, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { serviceItems, type ServiceItemRow } from "../schema";

export class ListServiceItemsQuery {
  private readonly db: DB;

  constructor() {
    this.db = getDb();
  }

  async query(): Promise<ServiceItemRow[]> {
    return this.db.select().from(serviceItems).orderBy(desc(serviceItems.createdAt));
  }
}

export interface ListServiceItemsByCategoryInput {
  categoryId: number;
}

export class ListServiceItemsByCategoryQuery {
  private readonly db: DB;
  constructor(private readonly input: ListServiceItemsByCategoryInput) {
    this.db = getDb();
  }

  async query(): Promise<ServiceItemRow[]> {
    return this.db
      .select()
      .from(serviceItems)
      .where(eq(serviceItems.categoryId, this.input.categoryId))
      .orderBy(desc(serviceItems.createdAt));
  }
}
