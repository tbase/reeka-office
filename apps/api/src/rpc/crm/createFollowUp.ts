import { CreateFollowUpCommand } from "@reeka-office/domain-crm";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";

export const createFollowUp = rpc.define({
  inputSchema: z.object({
    customerId: z.number().int().positive(),
    statusId: z.number().int().positive(),
    followedAt: z.string().optional().nullable(),
    content: z.string(),
  }),
  execute: mustAgent(async ({ context, input }) => {
    const followUpId = await new CreateFollowUpCommand({
      agentId: context.user.agentId,
      customerId: input.customerId,
      statusId: input.statusId,
      followedAt: input.followedAt,
      content: input.content,
    }).execute();

    return { followUpId };
  }),
});
