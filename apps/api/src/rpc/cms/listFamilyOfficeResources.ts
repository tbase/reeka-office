import { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { listFamilyOfficeResources as listFamilyOfficeResourcesData } from "./shared";

const inputSchema = z.object({
});

export type ListFamilyOfficeResourcesInput = z.infer<typeof inputSchema>;
type FamilyOfficeResourceFields = Record<string, unknown> & {
  banner?: string;
  category?: string;
  contentImage: string[];
  contactName: string;
  contactPhone: string;
  contactQrcode?: string;
};

export type ListFamilyOfficeResourcesOutput = {
  categories: Array<{
    id: number;
    slug: string;
    name: string;
    resourceCount: number;
  }>;
  currentCategorySlug: string;
  contents: Array<{
    id: number;
    categoryId: number;
    name: string;
    content: string;
    fields: FamilyOfficeResourceFields;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export const listFamilyOfficeResources = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ context }): Promise<ListFamilyOfficeResourcesOutput> => {
    return listFamilyOfficeResourcesData(context.tenantId);
  }),
});
