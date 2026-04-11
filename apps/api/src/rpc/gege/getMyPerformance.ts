import { GetGegeMyPerformanceQuery } from "@reeka-office/domain-performance";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { gegeYearInputSchema, requireAgentCode } from "./shared";

export type GetMyPerformanceInput = z.infer<typeof gegeYearInputSchema>;
export type GetMyPerformanceOutput = Awaited<
  ReturnType<GetGegeMyPerformanceQuery["query"]>
>;

export const getMyPerformance = rpc.define({
  inputSchema: gegeYearInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetMyPerformanceOutput> => {
    return new GetGegeMyPerformanceQuery({
      agentCode: requireAgentCode(context),
      year: input.year,
    }).query();
  }),
});
