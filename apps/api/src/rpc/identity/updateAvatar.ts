import { UpdateUserAvatarCommand } from "@reeka-office/domain-identity";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";

const inputSchema = z.object({
  avatar: z.string(),
});

export type UpdateAvatarInput = z.infer<typeof inputSchema>;
export type UpdateAvatarOutput = {
  avatar: string;
};

export const updateAvatar = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ input, context }) => {
    return await new UpdateUserAvatarCommand({
      openid: context.openid,
      avatar: input.avatar,
    }).execute();
  }),
});
