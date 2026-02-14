import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { serviceCategories, type ServiceCategoryRow } from "../schema";

export interface GetServiceCategoryInput {
  id: number;
}

export class GetServiceCategoryQuery {
  private readonly db: DB;
  constructor(private readonly input: GetServiceCategoryInput) {
    this.db = getDb();
  }

  async query(): Promise<ServiceCategoryRow | null> {
    const rows = await this.db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.id, this.input.id))
      .limit(1);
    return rows[0] ?? null;
  }
}
