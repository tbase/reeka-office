import { UpdateAvatarCommand } from "@reeka-office/domain-user";
import { createRpcError } from "@reeka-office/jsonrpc";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";

const inputSchema = z.object({
  avatar: z.string().url(),
});

export type UpdateAvatarInput = z.infer<typeof inputSchema>;
export type UpdateAvatarOutput = {
  avatar: string;
};

export const updateAvatar = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ input, context }) => {
    try {
      return await new UpdateAvatarCommand({
        openid: context.openid,
        avatar: input.avatar,
      }).execute();
    } catch (error) {
      if (error instanceof Error && error.message === "用户不存在") {
        throw createRpcError.badRequest("用户不存在，暂时无法更新头像");
      }

      throw error;
    }
  }),
});
