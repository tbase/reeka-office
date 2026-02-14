import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { serviceItems } from "../schema";

export interface DeleteServiceItemInput {
  id: number;
}

export class DeleteServiceItemCommand {
  private readonly db: DB;
  constructor(private readonly input: DeleteServiceItemInput) {
    this.db = getDb();
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(serviceItems)
      .where(eq(serviceItems.id, this.input.id));

    return result.affectedRows > 0;
  }
}
