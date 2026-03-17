import { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getFamilyOfficeResourceDetail as getFamilyOfficeResourceDetailData } from "./shared";

const inputSchema = z.object({
  id: z.string().trim().min(1),
});

export type GetFamilyOfficeResourceDetailInput = z.infer<typeof inputSchema>;
type FamilyOfficeResourceFields = Record<string, unknown> & {
  banner?: string;
  category?: string;
  contentImage: string[];
  contactName: string;
  contactPhone: string;
  contactQrcode?: string;
};

export type GetFamilyOfficeResourceDetailOutput = {
  id: number;
  categoryId: number;
  name: string;
  content: string;
  fields: FamilyOfficeResourceFields;
  createdAt: Date;
  updatedAt: Date;
};

export const getFamilyOfficeResourceDetail = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ input }): Promise<GetFamilyOfficeResourceDetailOutput> => {
    return getFamilyOfficeResourceDetailData(input.id);
  }),
});
