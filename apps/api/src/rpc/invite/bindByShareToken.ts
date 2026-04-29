import { GetAgentByCodeQuery, GetTeamMemberRelationQuery } from "@reeka-office/domain-agent";
import { BindUserByInviteShareTokenCommand, ResolveInviteShareTokenQuery } from "@reeka-office/domain-identity";
import { createRpcError } from "@reeka-office/jsonrpc";
import { z } from "zod";

import { config } from "../../config";
import { rpc } from "../../context";

const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/;

const inputSchema = z.object({
  shareToken: z.string().trim().min(1, "邀请链接无效"),
  agentCode: z.string().trim().regex(AGENT_CODE_REGEX, "代理人编码格式无效"),
  joinMonth: z.string().regex(/^\d{4}-\d{2}$/, "入职年月格式无效"),
});

export type BindByShareTokenInput = z.infer<typeof inputSchema>;
export type BindByShareTokenOutput = {
  tenantCode: string;
  agentId: number;
  tenants: Array<{
    tenantCode: string;
    tenantName: string;
    adminDomain: string;
    apiServiceName: string;
    agentId: number;
    boundAt: Date | null;
  }>;
};

export const bindByShareToken = rpc.define({
  inputSchema,
  execute: async ({ context, input }) => {
    const invite = await new ResolveInviteShareTokenQuery({
      token: input.shareToken,
    }).query();

    if (!invite) {
      throw createRpcError.badRequest("邀请链接不存在或已失效");
    }

    if (invite.isExpired) {
      throw createRpcError.badRequest("邀请链接已过期，请联系上级重新分享");
    }

    const tenantCode = config.tenantCode?.trim();
    if (!tenantCode || invite.tenantCode !== tenantCode) {
      throw createRpcError.badRequest("邀请链接租户不匹配");
    }

    const targetAgentCode = input.agentCode.trim().toUpperCase();
    if (targetAgentCode === invite.inviterAgentCode) {
      throw createRpcError.badRequest("不能通过自己的邀请链接绑定自己");
    }

    const [inviter, targetAgent] = await Promise.all([
      new GetAgentByCodeQuery({ agentCode: invite.inviterAgentCode }).query(),
      new GetAgentByCodeQuery({ agentCode: targetAgentCode }).query(),
    ]);

    if (!inviter) {
      throw createRpcError.badRequest("邀请人不存在或已失效");
    }

    if (!targetAgent) {
      throw createRpcError.badRequest("代理人不存在或已失效");
    }

    if (!targetAgent.joinDate) {
      throw createRpcError.badRequest("代理人入职年月缺失，请联系管理员");
    }

    if (targetAgent.joinDate.slice(0, 7) !== input.joinMonth) {
      throw createRpcError.badRequest("代理人编码或入职年月不匹配");
    }

    const relation = await new GetTeamMemberRelationQuery({
      leaderCode: inviter.agentCode,
      agentCode: targetAgent.agentCode,
    }).query();

    if (!relation || relation.hierarchy <= 0) {
      throw createRpcError.badRequest("该代理人不在邀请人的下属团队中");
    }

    try {
      const result = await new BindUserByInviteShareTokenCommand({
        openid: context.openid,
        token: invite.token,
        tenantCode,
        agentId: targetAgent.id,
      }).execute();

      return {
        tenantCode: result.tenantCode,
        agentId: result.agentId,
        tenants: result.tenants,
      };
    } catch (error) {
      throw createRpcError.badRequest(error instanceof Error ? error.message : "绑定失败");
    }
  },
});
