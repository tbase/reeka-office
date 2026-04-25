import { ListAgentLogsQuery, type ListAgentLogsResult } from "@reeka-office/domain-agent";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { gegeAgentLogsInputSchema, resolveAccessibleAgentCode } from "./shared";

export type ListAgentLogsInput = z.infer<typeof gegeAgentLogsInputSchema>;
export type ListAgentLogsOutput = ListAgentLogsResult;

export const listAgentLogs = rpc.define({
  inputSchema: gegeAgentLogsInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<ListAgentLogsOutput> => {
    const agentCode = await resolveAccessibleAgentCode(context, input?.agentCode);

    return new ListAgentLogsQuery({
      agentCode,
      category: input?.category === "all" ? undefined : input?.category,
      month: input?.month,
      limit: input?.limit,
    }).query();
  }),
});
