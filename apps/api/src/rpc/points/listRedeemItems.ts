import { ListRedemptionProductsQuery } from "@reeka-office/domain-point";
import { z } from "zod";

import { rpc } from "../../context";

const inputSchema = z.object({
  itemId: z.string().optional(),
});

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
  execute: async ({ input }) => {
    const products = await new ListRedemptionProductsQuery({ status: "published" }).query();

    const mappedProducts = products.map((product) => ({
      id: String(product.id),
      name: product.title,
      cost: product.redeemPoints,
      stock: product.stock,
      intro: product.description ?? "",
    }));

    // If itemId is provided, filter to return only the matching item
    if (input.itemId) {
      const filteredProduct = mappedProducts.find((item) => item.id === input.itemId);
      return filteredProduct ? [filteredProduct] : [];
    }

    return mappedProducts;
  },
});
