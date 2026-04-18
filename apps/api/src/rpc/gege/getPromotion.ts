import type { z } from "zod";

import {
  GetAgentPromotionSnapshotQuery,
  type AgentPromotionSnapshot,
} from "@reeka-office/domain-performance";

import { mustAgent, rpc } from "../../context";
import { gegeDashboardInputSchema, resolveAccessibleAgentCode } from "./shared";

export type GetPromotionInput = z.infer<typeof gegeDashboardInputSchema>;
export type GetPromotionOutput = AgentPromotionSnapshot;

export const getPromotion = rpc.define({
  inputSchema: gegeDashboardInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetPromotionOutput> => {
    const agentCode = await resolveAccessibleAgentCode(context, input?.agentCode);

    return new GetAgentPromotionSnapshotQuery({ agentCode }).query();
  }),
});
