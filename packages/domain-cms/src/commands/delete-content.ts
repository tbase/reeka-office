import { and, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { contents } from "../schema";
import type { TenantScope } from "../scope";

export interface DeleteContentInput {
  id: number;
}

export class DeleteContentCommand {
  private readonly db: DB;
  private readonly scope: TenantScope;
  private readonly input: DeleteContentInput;

  constructor(
    scope: TenantScope,
    input: DeleteContentInput,
  ) {
    this.db = getDb();
    this.scope = scope;
    this.input = input;
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(contents)
      .where(and(
        eq(contents.tenantId, this.scope.tenantId),
        eq(contents.id, this.input.id),
      ));

    return result.affectedRows > 0;
  }
}
