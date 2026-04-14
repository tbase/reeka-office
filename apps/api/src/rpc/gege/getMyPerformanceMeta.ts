import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getAgentPerformanceYears, type AgentPerformanceYearsResult } from "./history-performance";
import { gegeDashboardInputSchema, resolveAccessibleAgentCode } from "./shared";

export type GetMyPerformanceMetaInput = z.infer<typeof gegeDashboardInputSchema>;
export type GetMyPerformanceMetaOutput = AgentPerformanceYearsResult;

export const getMyPerformanceMeta = rpc.define({
  inputSchema: gegeDashboardInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetMyPerformanceMetaOutput> => {
    const agentCode = await resolveAccessibleAgentCode(context, input?.agentCode);

    return getAgentPerformanceYears(agentCode);
  }),
});
