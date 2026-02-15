import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, type FieldSchemaItem } from "../schema";

export interface UpdateCategoryInput {
  id: number;
  slug?: string;
  name?: string;
  description?: string | null;
  fieldSchema?: FieldSchemaItem[];
}

export class UpdateCategoryCommand {
  private readonly db: DB;
  constructor(private readonly input: UpdateCategoryInput) {
    this.db = getDb();
  }

  async execute(): Promise<boolean> {
    const values = {
      slug: this.input.slug,
      name: this.input.name,
      description: this.input.description,
      fieldSchema: this.input.fieldSchema
    };

    const [result] = await this.db
      .update(categories)
      .set(values)
      .where(eq(categories.id, this.input.id));
    
    return result.affectedRows > 0;
  }
}
