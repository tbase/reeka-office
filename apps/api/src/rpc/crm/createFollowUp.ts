import { CreateFollowUpCommand } from "@reeka-office/domain-crm";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";

export const createFollowUp = rpc.define({
  inputSchema: z.object({
    customerId: z.number().int().positive(),
    method: z.enum(["face", "phone", "wechat", "other"]).optional().nullable(),
    followedAt: z.string().optional().nullable(),
    content: z.string(),
  }),
  execute: mustAgent(async ({ context, input }) => {
    const followUpId = await new CreateFollowUpCommand({
      agentId: context.user.agentId,
      customerId: input.customerId,
      method: input.method,
      followedAt: input.followedAt,
      content: input.content,
    }).execute();

    return { followUpId };
  }),
});
