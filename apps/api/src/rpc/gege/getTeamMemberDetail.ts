import { GetGegeMemberDetailQuery } from "@reeka-office/domain-performance";
import { createRpcError } from "@reeka-office/jsonrpc";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { gegeMemberDetailInputSchema, requireAgentCode } from "./shared";

export type GetTeamMemberDetailInput = z.infer<typeof gegeMemberDetailInputSchema>;
export type GetTeamMemberDetailOutput = Exclude<
  Awaited<ReturnType<GetGegeMemberDetailQuery["query"]>>,
  null
>;

export const getTeamMemberDetail = rpc.define({
  inputSchema: gegeMemberDetailInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetTeamMemberDetailOutput> => {
    const result = await new GetGegeMemberDetailQuery({
      leaderCode: requireAgentCode(context),
      agentCode: input.agentCode,
      year: input.year,
    }).query();

    if (!result) {
      throw createRpcError.forbidden("仅可查看团队成员业绩");
    }

    return result;
  }),
});
