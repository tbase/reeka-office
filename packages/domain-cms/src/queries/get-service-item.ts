import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { serviceItems, type ServiceItemRow } from "../schema";

export interface GetServiceItemInput {
  id: number;
}

export class GetServiceItemQuery {
  private readonly db: DB;
  constructor(private readonly input: GetServiceItemInput) {
    this.db = getDb();
  }

  async query(): Promise<ServiceItemRow | null> {
    const rows = await this.db
      .select()
      .from(serviceItems)
      .where(eq(serviceItems.id, this.input.id))
      .limit(1);
    return rows[0] ?? null;
  }
}
