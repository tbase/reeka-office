import { and, eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, type FieldSchemaItem } from "../schema";
import type { TenantScope } from "../scope";

export interface UpdateCategoryInput {
  id: number;
  slug?: string;
  name?: string;
  description?: string | null;
  fieldSchema?: FieldSchemaItem[];
  hideContent?: boolean;
}

export class UpdateCategoryCommand {
  private readonly db: DB;
  private readonly scope: TenantScope;
  private readonly input: UpdateCategoryInput;

  constructor(
    scope: TenantScope,
    input: UpdateCategoryInput,
  ) {
    this.db = getDb();
    this.scope = scope;
    this.input = input;
  }

  async execute(): Promise<boolean> {
    const values = {
      slug: this.input.slug,
      name: this.input.name,
      description: this.input.description,
      fieldSchema: this.input.fieldSchema,
      hideContent: this.input.hideContent
    };

    const [result] = await this.db
      .update(categories)
      .set(values)
      .where(and(
        eq(categories.tenantId, this.scope.tenantId),
        eq(categories.id, this.input.id),
      ));

    return result.affectedRows > 0;
  }
}
