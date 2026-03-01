import { RedeemProductCommand } from "@reeka-office/domain-point";
import type { z } from "zod";

import { rpc } from "../../context";
import { redeemSubmitInputSchema } from "./shared";

export type SubmitRedeemInput = z.infer<typeof redeemSubmitInputSchema>;
export type SubmitRedeemOutput = { success: boolean; message: string };

export const submitRedeem = rpc.define({
  inputSchema: redeemSubmitInputSchema,
  execute: async ({ input, context }) => {
    const code = context.user!.agentCode!

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
