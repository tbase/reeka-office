import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, type FieldSchemaItem } from "../schema";

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
  private readonly input: UpdateCategoryInput;

  constructor(input: UpdateCategoryInput) {
    this.db = getDb();
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
      .where(eq(categories.id, this.input.id));

    return result.affectedRows > 0;
  }
}
