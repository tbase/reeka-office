import { UpdateUserNicknameCommand } from "@reeka-office/domain-identity";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";

const inputSchema = z.object({
  nickname: z.string().trim().max(64, "用户昵称不能超过 64 个字符").nullable(),
});

export type UpdateNicknameInput = z.infer<typeof inputSchema>;
export type UpdateNicknameOutput = {
  nickname: string | null;
};

export const updateNickname = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ input, context }) => {
    return await new UpdateUserNicknameCommand({
      openid: context.openid,
      nickname: input.nickname,
    }).execute();
  }),
});
