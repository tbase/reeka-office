import { ListRedemptionProductsQuery } from "@reeka-office/domain-point";
import { z } from "zod";

import { rpc } from "../../context";

const inputSchema = z.void();

export type ListRedeemItemsInput = z.infer<typeof inputSchema>;
export type ListRedeemItemsOutput = Array<{
  id: string;
  name: string;
  cost: number;
  stock: number;
  intro: string;
}>;

export const listRedeemItems = rpc.define({
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
