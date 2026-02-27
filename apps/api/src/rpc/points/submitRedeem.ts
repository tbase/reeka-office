import { RedeemProductCommand } from "@reeka-office/domain-point";
import { defineFunc } from "@reeka-office/jsonrpc";
import type { z } from "zod";

import { redeemSubmitInputSchema, type RequestContext } from "./shared";

export type SubmitRedeemInput = z.infer<typeof redeemSubmitInputSchema>;
export type SubmitRedeemOutput = { success: boolean; message: string };

export const submitRedeem = defineFunc<
  RequestContext,
  typeof redeemSubmitInputSchema,
  SubmitRedeemOutput
>({
  inputSchema: redeemSubmitInputSchema,
  execute: async ({ input, context }): Promise<SubmitRedeemOutput> => {
    const code = context.user.agentCode.toUpperCase();

    try {
      await new RedeemProductCommand({
        productId: Number(input.itemId),
        agentCode: code,
        remark: "来自小程序兑换",
      }).execute();

      return {
        success: true,
        message: "兑换成功",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "兑换失败";
      return {
        success: false,
        message,
      };
    }
  },
});
