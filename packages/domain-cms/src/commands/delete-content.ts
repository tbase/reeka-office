import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { contents } from "../schema";

export interface DeleteContentInput {
  id: number;
}

export class DeleteContentCommand {
  private readonly db: DB;
  constructor(private readonly input: DeleteContentInput) {
    this.db = getDb();
  }

  async execute(): Promise<boolean> {
    const [result] = await this.db
      .delete(contents)
      .where(eq(contents.id, this.input.id));

    return result.affectedRows > 0;
  }
}
