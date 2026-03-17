import { BindAgentCommand } from "@reeka-office/domain-user";
import { createRpcError } from "@reeka-office/jsonrpc";
import { z } from "zod";

import { rpc } from "../../context";

const inputSchema = z.object({
  code: z.string().trim().min(1),
  leaderCode: z.string().trim().min(1),
  unit: z.string().trim().min(1),
});

type RequestContext = {
  openid: string;
  envid: string;
};

export type BindAgentInput = z.infer<typeof inputSchema>;
export type BindAgentOutput = {
  agentId: number;
  tenantId: number;
  agentCode: string;
  agentName: string;
};

export const bindAgent = rpc.define({
  inputSchema,
  execute: async ({ input, context }) => {
    const { openid } = context as RequestContext;

    try {
      return await new BindAgentCommand({
        openid,
        code: input.code,
        leaderCode: input.leaderCode,
        unit: input.unit,
      }).execute();
    } catch (error) {
      if (error instanceof Error && error.message === "用户已绑定代理人") {
        throw createRpcError.badRequest("您已绑定代理人，无需重复操作");
      }
      if (error instanceof Error && error.message === "代理人不存在") {
        throw createRpcError.badRequest("信息不匹配，请核对后重试");
      }
      throw error;
    }
  },
});
