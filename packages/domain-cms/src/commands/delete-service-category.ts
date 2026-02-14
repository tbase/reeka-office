import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { serviceCategories, serviceItems } from "../schema";

export interface DeleteServiceCategoryInput {
  id: number;
}

export class DeleteServiceCategoryCommand {
  private readonly db: DB;
  constructor(private readonly input: DeleteServiceCategoryInput) {
    this.db = getDb();
  }

  async execute(): Promise<boolean> {
    const existingItems = await this.db
      .select({ id: serviceItems.id })
      .from(serviceItems)
      .where(eq(serviceItems.categoryId, this.input.id))
      .limit(1);

    if (existingItems.length > 0) {
      throw new Error("Category has items; delete/reassign items first");
    }

    const [result] = await this.db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, this.input.id));

    return result.affectedRows > 0;
  }
}
