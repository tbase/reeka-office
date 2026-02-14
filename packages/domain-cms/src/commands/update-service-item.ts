import { eq } from "drizzle-orm";
import { getDb, type DB } from "../context";
import { serviceItems, type NewServiceItemRow } from "../schema";

export interface UpdateServiceItemInput {
  id: number;
  categoryId: number;
  name: string;
  content: string;
  wechatId?: string | null;
  wechatQrCode?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
}

export class UpdateServiceItemCommand {
  private readonly db: DB;
  constructor(private readonly input: UpdateServiceItemInput) {
    this.db = getDb();
  }

  async execute(): Promise<boolean> {
    const values: Partial<NewServiceItemRow> = {
      categoryId: this.input.categoryId,
      name: this.input.name,
      content: this.input.content,
      wechatId: this.input.wechatId ?? null,
      wechatQrCode: this.input.wechatQrCode ?? null,
      contactName: this.input.contactName ?? null,
      contactPhone: this.input.contactPhone ?? null
    };

    const [result] = await this.db
      .update(serviceItems)
      .set(values)
      .where(eq(serviceItems.id, this.input.id));

    return result.affectedRows > 0;
  }
}
