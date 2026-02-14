import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { serviceCategories } from "../schema";

export interface UpdateServiceCategoryInput {
  id: number;
  name: string;
}

export class UpdateServiceCategoryCommand {
  private readonly db: DB;
  constructor(private readonly input: UpdateServiceCategoryInput) {
    this.db = getDb();
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .update(serviceCategories)
      .set({ name: this.input.name })
      .where(eq(serviceCategories.id, this.input.id));
    
    return result.affectedRows > 0;
  }
}
