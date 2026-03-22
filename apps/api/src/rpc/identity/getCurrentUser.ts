import { z } from "zod";

import { mustAgent, rpc } from "../../context";

const inputSchema = z.void();

export type GetCurrentUserInput = z.infer<typeof inputSchema>;
export type GetCurrentUserOutput = {
  id: number;
  openid: string;
  nickname: string | null;
  avatar: string | null;
  agentId: number;
  agentCode: string | null;
  agentName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
} | null;

export const getCurrentUser = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ context }) => context.user)
});
