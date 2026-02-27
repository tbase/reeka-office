import { ListRedemptionProductsQuery } from "@reeka-office/domain-point";
import { defineFunc } from "@reeka-office/jsonrpc";
import { z } from "zod";

import type { RequestContext } from "./shared";

const inputSchema = z.void();

export type ListRedeemItemsInput = z.infer<typeof inputSchema>;
export type ListRedeemItemsOutput = Array<{
  id: string;
  name: string;
  cost: number;
  stock: number;
  intro: string;
}>;

export const listRedeemItems = defineFunc<RequestContext, typeof inputSchema, ListRedeemItemsOutput>({
  inputSchema,
  execute: async () => {
    const products = await new ListRedemptionProductsQuery({ status: "published" }).query();

    return products.map((product) => ({
      id: String(product.id),
      name: product.title,
      cost: product.redeemPoints,
      stock: product.stock,
      intro: product.description ?? "",
    }));
  },
});
