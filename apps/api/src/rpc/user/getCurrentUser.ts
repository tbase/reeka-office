import { GetUserQuery, type GetUserResult } from "@reeka-office/domain-user";
import { defineFunc } from "@reeka-office/jsonrpc";
import { z } from "zod";

const inputSchema = z.void();

type RequestContext = {
  openid: string;
  envid: string;
};

export type GetCurrentUserInput = z.infer<typeof inputSchema>;
export type GetCurrentUserOutput = GetUserResult | null;

export const getCurrentUser = defineFunc<unknown, typeof inputSchema, GetCurrentUserOutput>({
  inputSchema,
  execute: async ({ context }): Promise<GetCurrentUserOutput> => {
    const { openid } = context as RequestContext;
    return new GetUserQuery({ openid }).query();
  },
});
