import { CreateInviteShareTokenCommand } from "@reeka-office/domain-identity";
import { createRpcError } from "@reeka-office/jsonrpc";
import { z } from "zod";

import { config } from "../../config";
import { mustAgent, rpc } from "../../context";

const inputSchema = z.void();

export type CreateInviteShareTokenInput = z.infer<typeof inputSchema>;
export type CreateInviteShareTokenOutput = {
  token: string;
  tenantCode: string;
  tenantName: string;
  apiServiceName: string;
  inviterAgentCode: string;
  inviterName: string | null;
  expiresAt: Date;
};

export const createInviteShareToken = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ context }) => {
    const tenantCode = config.tenantCode?.trim();
    const inviterAgentCode = context.agent.agentCode?.trim();

    if (!tenantCode) {
      throw createRpcError.internalError("缺少 tenant code");
    }

    if (!inviterAgentCode) {
      throw createRpcError.internalError("邀请人代理人编码不存在");
    }

    const result = await new CreateInviteShareTokenCommand({
      tenantCode,
      inviterAgentId: context.agent.agentId,
      inviterAgentCode,
    }).execute();

    return {
      token: result.token,
      tenantCode: result.tenantCode,
      tenantName: result.tenantName,
      apiServiceName: result.apiServiceName,
      inviterAgentCode: result.inviterAgentCode,
      inviterName: context.agent.agentName,
      expiresAt: result.expiresAt,
    };
  }),
});
