import { GetAgentPointBalanceQuery, ListRedemptionProductsQuery } from "@reeka-office/domain-point";
import { defineFunc, RpcError, RpcErrorCode } from "@reeka-office/jsonrpc";
import type { z } from "zod";

import {
  parseNotes,
  redeemDetailInputSchema,
  type RequestContext,
} from "./shared";

export type GetRedeemDetailInput = z.infer<typeof redeemDetailInputSchema>;
export type GetRedeemDetailOutput = {
  memberPoints: number;
  item: {
    id: string;
    name: string;
    cost: number;
    stock: number;
    desc: string;
    notes: string[];
  };
};

export const getRedeemDetail = defineFunc<
  RequestContext,
  typeof redeemDetailInputSchema,
  GetRedeemDetailOutput
>({
  inputSchema: redeemDetailInputSchema,
  execute: async ({ input, context }): Promise<GetRedeemDetailOutput> => {
    const code = context.user.agentCode.toUpperCase();

    const [products, balance] = await Promise.all([
      new ListRedemptionProductsQuery({ status: "published" }).query(),
      new GetAgentPointBalanceQuery({ agentCode: code }).query(),
    ]);

    const product = products.find((item) => String(item.id) === input.itemId);

    if (!product) {
      throw new RpcError(RpcErrorCode.NOT_FOUND, "兑换商品不存在或已下架");
    }

    return {
      memberPoints: balance?.currentPoints ?? 0,
      item: {
        id: String(product.id),
        name: product.title,
        cost: product.redeemPoints,
        stock: product.stock,
        desc: product.description ?? "",
        notes: parseNotes(product.notice),
      },
    };
  },
});
