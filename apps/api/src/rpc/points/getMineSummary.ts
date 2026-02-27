import { GetAgentPointBalanceQuery } from "@reeka-office/domain-point";
import { defineFunc } from "@reeka-office/jsonrpc";
import type { z } from "zod";

import { agentInputSchema, type RequestContext } from "./shared";

export type GetMineSummaryInput = z.infer<typeof agentInputSchema>;
export type GetMineSummaryOutput = {
  name: string;
  totalPoints: number;
};

export const getMineSummary = defineFunc<RequestContext, typeof agentInputSchema, GetMineSummaryOutput>({
  inputSchema: agentInputSchema,
  execute: async ({ context }): Promise<GetMineSummaryOutput> => {
    const code = context.user.agentCode.toUpperCase();
    const balance = await new GetAgentPointBalanceQuery({ agentCode: code }).query();

    return {
      name: code,
      totalPoints: balance?.currentPoints ?? 0,
    };
  },
});
