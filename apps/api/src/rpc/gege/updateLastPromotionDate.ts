import { UpdateAgentLastPromotionDateCommand } from "@reeka-office/domain-agent";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { gegeDashboardInputSchema, resolveAccessibleAgentCode } from "./shared";

const inputSchema = gegeDashboardInputSchema.unwrap().extend({
  lastPromotionDate: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
});

export type UpdateLastPromotionDateInput = z.infer<typeof inputSchema>;
export type UpdateLastPromotionDateOutput = {
  agentCode: string;
  lastPromotionDate: string | null;
};

export const updateLastPromotionDate = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ context, input }): Promise<UpdateLastPromotionDateOutput> => {
    const agentCode = await resolveAccessibleAgentCode(context, input.agentCode);

    return new UpdateAgentLastPromotionDateCommand({
      agentCode,
      lastPromotionDate: input.lastPromotionDate,
    }).execute();
  }),
});
