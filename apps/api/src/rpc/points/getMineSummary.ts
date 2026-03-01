import { GetAgentPointBalanceQuery } from "@reeka-office/domain-point";
import type { z } from "zod";
import { rpc } from "../../context";

import { agentInputSchema } from "./shared";

export type GetMineSummaryInput = z.infer<typeof agentInputSchema>;
export type GetMineSummaryOutput = {
  name: string;
  totalPoints: number;
};

export const getMineSummary = rpc.define({
  inputSchema: agentInputSchema,
  execute: async ({ context }): Promise<GetMineSummaryOutput> => {
    const code = context.user!.agentCode!
    const balance = await new GetAgentPointBalanceQuery({ agentCode: code }).query();

    return {
      name: code,
      totalPoints: balance?.currentPoints ?? 0,
    };
  },
});
