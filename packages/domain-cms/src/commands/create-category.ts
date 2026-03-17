import { getDb, type DB } from "../context";
import { categories, type FieldSchemaItem, type NewCategoryRow } from "../schema";
import type { TenantScope } from "../scope";

export interface CreateCategoryInput {
  slug?: string;
  name: string;
  description?: string | null;
  fieldSchema?: FieldSchemaItem[];
  hideContent?: boolean;
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export class CreateCategoryCommand {
  private readonly db: DB;
  private readonly scope: TenantScope;
  private readonly input: CreateCategoryInput;

  constructor(
    scope: TenantScope,
    input: CreateCategoryInput,
  ) {
    this.db = getDb();
    this.scope = scope;
    this.input = input;
  }

  async execute(): Promise<number | null> {
    const values: NewCategoryRow = {
      tenantId: this.scope.tenantId,
      slug: this.input.slug ?? toSlug(this.input.name),
      name: this.input.name,
      description: this.input.description ?? null,
      fieldSchema: this.input.fieldSchema ?? [],
      hideContent: this.input.hideContent ?? false
    };
    const result = await this.db.insert(categories).values(values).$returningId();
    return result[0]?.id ?? null;
  }
}
