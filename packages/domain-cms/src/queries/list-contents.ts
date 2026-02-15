import { desc, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { contents, type ContentRow } from "../schema";

export class ListContentsQuery {
  private readonly db: DB;

  constructor() {
    this.db = getDb();
  }

  async query(): Promise<ContentRow[]> {
    return this.db.select().from(contents).orderBy(desc(contents.createdAt));
  }
}

export interface ListContentsByCategoryInput {
  categoryId: number;
}

export class ListContentsByCategoryQuery {
  private readonly db: DB;
  constructor(private readonly input: ListContentsByCategoryInput) {
    this.db = getDb();
  }

  async query(): Promise<ContentRow[]> {
    return this.db
      .select()
      .from(contents)
      .where(eq(contents.categoryId, this.input.categoryId))
      .orderBy(desc(contents.createdAt));
  }
}
