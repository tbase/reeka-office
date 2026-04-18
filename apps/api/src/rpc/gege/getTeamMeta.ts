import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { gegeDashboardInputSchema, resolveAccessibleAgentCode } from "./shared";
import { buildTeamMeta, getTeamAgent, type TeamMeta } from "./team-scope";

export type GetTeamMetaInput = z.infer<typeof gegeDashboardInputSchema>;
export type GetTeamMetaOutput = TeamMeta;

export const getTeamMeta = rpc.define({
  inputSchema: gegeDashboardInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetTeamMetaOutput> => {
    const agentCode = await resolveAccessibleAgentCode(context, input?.agentCode);
    const agent = await getTeamAgent(agentCode);

    return buildTeamMeta(agent);
  }),
});
