import { UpdateAvatarCommand } from "@reeka-office/domain-user";
import { createRpcError } from "@reeka-office/jsonrpc";
import { z } from "zod";

import { rpc } from "../../context";

const inputSchema = z.object({
  avatar: z.string().url(),
});

type RequestContext = {
  openid: string;
  envid: string;
};

export type UpdateAvatarInput = z.infer<typeof inputSchema>;
export type UpdateAvatarOutput = {
  avatar: string;
};

export const updateAvatar = rpc.define({
  inputSchema,
  execute: async ({ input, context }) => {
    const { openid } = context as RequestContext;

    try {
      return await new UpdateAvatarCommand({
        openid,
        avatar: input.avatar,
      }).execute();
    } catch (error) {
      if (error instanceof Error && error.message === "用户不存在") {
        throw createRpcError.badRequest("用户不存在，暂时无法更新头像");
      }

      throw error;
    }
  },
});
