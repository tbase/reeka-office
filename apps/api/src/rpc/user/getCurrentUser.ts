import { z } from "zod";
import type { GetUserResult } from "@reeka-office/domain-user";

import { mustAgent, rpc } from "../../context";

const inputSchema = z.void();

export type GetCurrentUserInput = z.infer<typeof inputSchema>;
export type GetCurrentUserOutput = GetUserResult | null;

export const getCurrentUser = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ context }) => context.user)
});
