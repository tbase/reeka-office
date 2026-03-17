import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, contents, type ContentFields, type NewContentRow } from "../schema";

export interface CreateContentInput {
  categoryId: number;
  name: string;
  content: string;
  fields?: ContentFields;
}

export class CreateContentCommand {
  private readonly db: DB;
  private readonly input: CreateContentInput;

  constructor(input: CreateContentInput) {
    this.db = getDb();
    this.input = input;
  }

  async execute(): Promise<number | null> {
    const categoryRows = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, this.input.categoryId))
      .limit(1);

    if (!categoryRows[0]) {
      throw new Error("Category not found");
    }

    const values: NewContentRow = {
      categoryId: this.input.categoryId,
      name: this.input.name,
      content: this.input.content,
      fields: this.input.fields ?? {}
    };

    const result = await this.db.insert(contents).values(values).$returningId();
    return result[0]?.id ?? null;
  }
}
