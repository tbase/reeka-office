import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { contents, type ContentRow } from "../schema";

export interface GetContentInput {
  id: number;
}

export class GetContentQuery {
  private readonly db: DB;
  constructor(private readonly input: GetContentInput) {
    this.db = getDb();
  }

  async query(): Promise<ContentRow | null> {
    const rows = await this.db
      .select()
      .from(contents)
      .where(eq(contents.id, this.input.id))
      .limit(1);
    return rows[0] ?? null;
  }
}
