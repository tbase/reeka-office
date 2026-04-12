import { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getAgentPerformanceYears, type AgentPerformanceYearsResult } from "./history-performance";
import { requireAgentCode } from "./shared";

const inputSchema = z.void();

export type GetMyPerformanceMetaInput = z.infer<typeof inputSchema>;
export type GetMyPerformanceMetaOutput = AgentPerformanceYearsResult;

export const getMyPerformanceMeta = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ context }): Promise<GetMyPerformanceMetaOutput> => {
    return getAgentPerformanceYears(requireAgentCode(context));
  }),
});
