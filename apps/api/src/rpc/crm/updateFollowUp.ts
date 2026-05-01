import { UpdateFollowUpCommand } from "@reeka-office/domain-crm";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";

export const updateFollowUp = rpc.define({
  inputSchema: z.object({
    customerId: z.number().int().positive(),
    followUpId: z.number().int().positive(),
    method: z.enum(["face", "phone", "wechat", "other"]).optional().nullable(),
    followedAt: z.string().optional().nullable(),
    content: z.string(),
  }),
  execute: mustAgent(async ({ context, input }) => {
    await new UpdateFollowUpCommand({
      agentId: context.user.agentId,
      customerId: input.customerId,
      followUpId: input.followUpId,
      method: input.method,
      followedAt: input.followedAt,
      content: input.content,
    }).execute();

    return { success: true };
  }),
});
