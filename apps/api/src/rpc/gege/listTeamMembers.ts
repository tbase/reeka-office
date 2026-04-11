import { ListGegeTeamMembersQuery } from "@reeka-office/domain-performance";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { gegeTeamMembersInputSchema, requireAgentCode } from "./shared";

export type ListTeamMembersInput = z.infer<typeof gegeTeamMembersInputSchema>;
export type ListTeamMembersOutput = Awaited<
  ReturnType<ListGegeTeamMembersQuery["query"]>
>;

export const listTeamMembers = rpc.define({
  inputSchema: gegeTeamMembersInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<ListTeamMembersOutput> => {
    return new ListGegeTeamMembersQuery({
      leaderCode: requireAgentCode(context),
      scope: input.scope,
    }).query();
  }),
});
