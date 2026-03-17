import { and, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, contents } from "../schema";
import type { TenantScope } from "../scope";

export interface DeleteCategoryInput {
  id: number;
}

export class DeleteCategoryCommand {
  private readonly db: DB;
  private readonly scope: TenantScope;
  private readonly input: DeleteCategoryInput;

  constructor(
    scope: TenantScope,
    input: DeleteCategoryInput,
  ) {
    this.db = getDb();
    this.scope = scope;
    this.input = input;
  }

  async execute(): Promise<boolean> {
    const existingItems = await this.db
      .select({ id: contents.id })
      .from(contents)
      .where(and(
        eq(contents.tenantId, this.scope.tenantId),
        eq(contents.categoryId, this.input.id),
      ))
      .limit(1);

    if (existingItems.length > 0) {
      throw new Error("Category has items; delete/reassign items first");
    }

    const [result] = await this.db
      .delete(categories)
      .where(and(
        eq(categories.tenantId, this.scope.tenantId),
        eq(categories.id, this.input.id),
      ));

    return result.affectedRows > 0;
  }
}
