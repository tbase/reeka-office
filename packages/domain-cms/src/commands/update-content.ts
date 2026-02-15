import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { contents, type ContentFields, type NewContentRow } from "../schema";

export interface UpdateContentInput {
  id: number;
  categoryId: number;
  name: string;
  content: string;
  fields?: ContentFields;
}

export class UpdateContentCommand {
  private readonly db: DB;
  constructor(private readonly input: UpdateContentInput) {
    this.db = getDb();
  }

  async execute(): Promise<boolean> {
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
