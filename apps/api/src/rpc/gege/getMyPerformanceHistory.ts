import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getAgentPerformanceHistory, type AgentPerformanceHistoryResult } from "./history-performance";
import { gegeYearInputSchema, resolveAccessibleAgentCode } from "./shared";

const inputSchema = gegeYearInputSchema.extend({
  year: gegeYearInputSchema.shape.year.unwrap(),
});

export type GetMyPerformanceHistoryInput = z.infer<typeof inputSchema>;
export type GetMyPerformanceHistoryOutput = AgentPerformanceHistoryResult;

export const getMyPerformanceHistory = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetMyPerformanceHistoryOutput> => {
    const agentCode = await resolveAccessibleAgentCode(context, input.agentCode);

    return getAgentPerformanceHistory(agentCode, input.year);
  }),
});
