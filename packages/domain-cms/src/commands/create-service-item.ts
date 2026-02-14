import { getDb, type DB } from "../context";
import { serviceItems, type NewServiceItemRow } from "../schema";

export interface CreateServiceItemInput {
  categoryId: number;
  name: string;
  content: string;
  wechatId?: string | null;
  wechatQrCode?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
}

export class CreateServiceItemCommand {
  private readonly db: DB;
  constructor(private readonly input: CreateServiceItemInput) {
    this.db = getDb();
  }

  async execute(): Promise<number | null> {
    const values: NewServiceItemRow = {
      categoryId: this.input.categoryId,
      name: this.input.name,
      content: this.input.content,
      wechatId: this.input.wechatId ?? null,
      wechatQrCode: this.input.wechatQrCode ?? null,
      contactName: this.input.contactName ?? null,
      contactPhone: this.input.contactPhone ?? null
    };

    const result = await this.db.insert(serviceItems).values(values).$returningId();
    return result[0]?.id ?? null;
  }
}
