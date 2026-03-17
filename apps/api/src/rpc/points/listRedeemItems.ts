import { ListAgentRedeemCountsQuery, ListRedemptionProductsQuery } from "@reeka-office/domain-point";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { normalizeImageURL } from "../../lib/image-url";
import { redeemItemIdSchema } from "./shared";

const inputSchema = z.object({
  itemId: redeemItemIdSchema.optional(),
});

export type ListRedeemItemsInput = z.infer<typeof inputSchema>;
export type ListRedeemItemsOutput = Array<{
  id: string;
  redeemCategory: string;
  title: string;
  description: string;
  redeemPoints: number;
  stock: number;
  imageUrl?: string;
  notice: string;
  maxRedeemPerAgent: number;
  redeemedCount: number;
}>;

function isProductWithinValidity(publishedAt: Date | null, validPeriodMonths: number | null): boolean {
  if (!publishedAt || !validPeriodMonths) {
    return true
  }

  const expiryAt = new Date(publishedAt)
  expiryAt.setMonth(expiryAt.getMonth() + validPeriodMonths)
  return expiryAt.getTime() >= Date.now()
}

export const listRedeemItems = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ input, context }) => {
    const redeemCountMap = new Map<number, number>()
    const counts = await new ListAgentRedeemCountsQuery(context, {
      agentId: context.agent.agentId,
    }).query()
    for (const item of counts) {
      redeemCountMap.set(item.productId, item.redeemedCount)
    }

    const products = await new ListRedemptionProductsQuery(context, {
      status: "published",
    }).query();
    const validProducts = products.filter((product) =>
      isProductWithinValidity(product.publishedAt, product.validPeriodMonths),
    )

    const mappedProducts = validProducts.map((product) => ({
      id: product.id == null ? "" : String(product.id),
      redeemCategory: product.redeemCategory ?? "",
      title: product.title ?? "",
      description: product.description ?? "",
      redeemPoints: product.redeemPoints ?? 0,
      stock: product.stock ?? 0,
      imageUrl: normalizeImageURL(product.imageUrl),
      notice: product.notice ?? "",
      maxRedeemPerAgent: product.maxRedeemPerAgent ?? 1,
      redeemedCount: product.id == null ? 0 : redeemCountMap.get(product.id) ?? 0,
    }));

    const sortedProducts = mappedProducts.slice().sort((a, b) => {
      const aSink = a.stock <= 0 || a.redeemedCount >= a.maxRedeemPerAgent
      const bSink = b.stock <= 0 || b.redeemedCount >= b.maxRedeemPerAgent

      if (aSink === bSink) {
        return 0
      }

      return aSink ? 1 : -1
    })

    // If itemId is provided, filter to return only the matching item
    if (input.itemId) {
      const filteredProduct = sortedProducts.find((item) => item.id === input.itemId);
      return filteredProduct ? [filteredProduct] : [];
    }

    return sortedProducts;
  }),
});
