import { getDb, type DB } from "../context";
import { contents, type ContentFields, type NewContentRow } from "../schema";

export interface CreateContentInput {
  categoryId: number;
  name: string;
  content: string;
  fields?: ContentFields;
}

export class CreateContentCommand {
  private readonly db: DB;
  constructor(private readonly input: CreateContentInput) {
    this.db = getDb();
  }

  async execute(): Promise<number | null> {
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
