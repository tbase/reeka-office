import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, contents, type ContentFields, type NewContentRow } from "../schema";

export interface UpdateContentInput {
  id: number;
  categoryId: number;
  name: string;
  content: string;
  fields?: ContentFields;
}

export class UpdateContentCommand {
  private readonly db: DB;
  private readonly input: UpdateContentInput;

  constructor(input: UpdateContentInput) {
    this.db = getDb();
    this.input = input;
  }

  async execute(): Promise<boolean> {
    const categoryRows = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, this.input.categoryId))
      .limit(1);

    if (!categoryRows[0]) {
      throw new Error("Category not found");
    }

    const values: Partial<NewContentRow> = {
      categoryId: this.input.categoryId,
      name: this.input.name,
      content: this.input.content,
      fields: this.input.fields ?? {}
    };

    const [result] = await this.db
      .update(contents)
      .set(values)
      .where(eq(contents.id, this.input.id));

    return result.affectedRows > 0;
  }
}
