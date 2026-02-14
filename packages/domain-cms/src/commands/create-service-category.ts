import { getDb, type DB } from "../context";
import { serviceCategories, type NewServiceCategoryRow } from "../schema";

export interface CreateServiceCategoryInput {
  name: string;
}

export class CreateServiceCategoryCommand {
  private readonly db: DB;
  constructor(private readonly input: CreateServiceCategoryInput) {
    this.db = getDb();
  }

  async execute(): Promise<number | null> {
    const values: NewServiceCategoryRow = { name: this.input.name };
    const result = await this.db.insert(serviceCategories).values(values).$returningId();
    return result[0]?.id ?? null;
  }
}
