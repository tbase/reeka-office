import { BindAgentCommand } from "@reeka-office/domain-user";
import { createRpcError, defineFunc } from "@reeka-office/jsonrpc";
import { z } from "zod";

import { config } from "@/config";

const inputSchema = z.object({
  token: z.string().min(1),
});

const agentInfoSchema = z.object({
  agent_code: z.string().min(1),
  pinyin: z.string().min(1),
});

type RequestContext = {
  openid: string;
  envid: string;
};

export type BindAgentInput = z.infer<typeof inputSchema>;
export type BindAgentOutput = {
  agentCode: string;
  agentName: string;
};

export const bindAgent = defineFunc<unknown, typeof inputSchema, BindAgentOutput>({
  inputSchema,
  execute: async ({ input, context }): Promise<BindAgentOutput> => {
    const { openid } = context as RequestContext;

    let response: Response;
    try {
      response = await fetch(config.externalApi.agentInfoUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${input.token}`,
        },
      });
    } catch {
      throw createRpcError.internalError("网络错误，请稍后重试");
    }

    if (!response.ok) {
      throw createRpcError.badRequest("代理人 token 无效或已过期");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw createRpcError.badRequest("代理人 token 无效或已过期");
    }

    const parsedAgentInfo = agentInfoSchema.safeParse(payload);
    if (!parsedAgentInfo.success) {
      throw createRpcError.badRequest("代理人 token 无效或已过期");
    }

    const agentCode = parsedAgentInfo.data.agent_code;
    const agentName = parsedAgentInfo.data.pinyin;

    try {
      return await new BindAgentCommand({
        openid,
        agentCode,
        agentName,
      }).execute();
    } catch (error) {
      if (error instanceof Error && error.message === "用户已绑定代理人") {
        throw createRpcError.badRequest("您已绑定代理人，无需重复操作");
      }
      throw error;
    }
  },
});
