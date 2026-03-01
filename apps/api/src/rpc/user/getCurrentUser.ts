import { GetUserQuery, type GetUserResult } from "@reeka-office/domain-user";
import { z } from "zod";
import { rpc } from "../../context";

const inputSchema = z.void();

type RequestContext = {
  openid: string;
  envid: string;
};

export type GetCurrentUserInput = z.infer<typeof inputSchema>;
export type GetCurrentUserOutput = GetUserResult | null;

export const getCurrentUser = rpc.define({
  inputSchema,
  execute: async ({ context }) => {
    const { openid } = context as RequestContext;
    return new GetUserQuery({ openid }).query();
  }
});
