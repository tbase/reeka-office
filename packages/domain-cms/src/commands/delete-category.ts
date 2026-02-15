import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { categories, contents } from "../schema";

export interface DeleteCategoryInput {
  id: number;
}

export class DeleteCategoryCommand {
  private readonly db: DB;
  constructor(private readonly input: DeleteCategoryInput) {
    this.db = getDb();
  }

  async execute(): Promise<boolean> {
    const existingItems = await this.db
      .select({ id: contents.id })
      .from(contents)
      .where(eq(contents.categoryId, this.input.id))
      .limit(1);

    if (existingItems.length > 0) {
      throw new Error("Category has items; delete/reassign items first");
    }

    const [result] = await this.db
      .delete(categories)
      .where(eq(categories.id, this.input.id));

    return result.affectedRows > 0;
  }
}
