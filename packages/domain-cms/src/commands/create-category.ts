import { getDb, type DB } from "../context";
import { categories, type FieldSchemaItem, type NewCategoryRow } from "../schema";

export interface CreateCategoryInput {
  slug?: string;
  name: string;
  description?: string | null;
  fieldSchema?: FieldSchemaItem[];
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
  constructor(private readonly input: CreateCategoryInput) {
    this.db = getDb();
  }

  async execute(): Promise<number | null> {
    const values: NewCategoryRow = {
      slug: this.input.slug ?? toSlug(this.input.name),
      name: this.input.name,
      description: this.input.description ?? null,
      fieldSchema: this.input.fieldSchema ?? []
    };
    const result = await this.db.insert(categories).values(values).$returningId();
    return result[0]?.id ?? null;
  }
}
