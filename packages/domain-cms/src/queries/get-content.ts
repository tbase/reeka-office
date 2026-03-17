import { and, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { contents, type ContentRow } from "../schema";
import type { TenantScope } from "../scope";

export interface GetContentInput {
  id: number;
}

export class GetContentQuery {
  private readonly db: DB;
  private readonly scope: TenantScope;
  private readonly input: GetContentInput;

  constructor(
    scope: TenantScope,
    input: GetContentInput,
  ) {
    this.db = getDb();
    this.scope = scope;
    this.input = input;
  }

  async query(): Promise<ContentRow | null> {
    const rows = await this.db
      .select()
      .from(contents)
      .where(and(
        eq(contents.tenantId, this.scope.tenantId),
        eq(contents.id, this.input.id),
      ))
      .limit(1);
    return rows[0] ?? null;
  }
}
