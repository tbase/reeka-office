import { GetAgentPointBalanceQuery } from "@reeka-office/domain-point";
import type { z } from "zod";
import { rpc } from "../../context";

import { agentInputSchema } from "./shared";

export type GetMineSummaryInput = z.infer<typeof agentInputSchema>;
export type GetMineSummaryOutput = {
  agentCode: string | null;
  currentPoints: number;
};

export const getMineSummary = rpc.define({
  inputSchema: agentInputSchema,
  execute: async ({ context }): Promise<GetMineSummaryOutput> => {
    const balance = await new GetAgentPointBalanceQuery({ agentId: context.user!.agentId }).query();

    return {
      agentCode: context.user!.agentCode,
      currentPoints: balance?.currentPoints ?? 0,
    };
  },
});
