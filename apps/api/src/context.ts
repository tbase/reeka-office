import type { User } from "@reeka-office/domain-user";
import { createRpc } from "@reeka-office/jsonrpc";

export type APIContext = {
  openid: string;
  envid: string;
  tenantId: number | null;
  user: User | null;
};

export type AgentContext = {
  openid: string;
  envid: string;
  user: User;
  agent: {
    agentId: number;
    agentCode: string | null;
    agentName: string | null;
  };
  tenantId: number;
};

export const rpc = createRpc<APIContext>();

export function mustAgentContext(context: APIContext) {
  if (!context.user?.agentId) {
    throw new Error("Agent is required");
  }
  const user = context.user;
  const agent = {
    agentId: user.agentId!,
    agentCode: user.agentCode,
    agentName: user.agentName,
  };
  const tenantId = context.tenantId!;
  return {
    openid: context.openid,
    envid: context.envid,
    user,
    agent,
    tenantId,
  };
}

export function mustAgent<TInput, TOutput>(fn: (params: { context: AgentContext, input: TInput }) => Promise<TOutput>) {
  return async ({ context, input }: { context: APIContext, input: TInput }): Promise<TOutput> => {
    const agentContext = mustAgentContext(context);
    return fn({ context: agentContext, input: input });
  };
}
