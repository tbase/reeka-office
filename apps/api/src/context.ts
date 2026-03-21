import { createRpc } from "@reeka-office/jsonrpc";

export type APIUser = {
  id: number;
  openid: string;
  nickname: string | null;
  avatar: string | null;
  agentId: number;
  agentCode: string | null;
  agentName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type APIContext = {
  openid: string;
  envid: string;
  user: APIUser | null;
};

export type AgentContext = {
  openid: string;
  envid: string;
  user: APIUser;
  agent: {
    agentId: number;
    agentCode: string | null;
    agentName: string | null;
  };
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
  return {
    openid: context.openid,
    envid: context.envid,
    user,
    agent,
  };
}

export function mustAgent<TInput, TOutput>(fn: (params: { context: AgentContext, input: TInput }) => Promise<TOutput>) {
  return async ({ context, input }: { context: APIContext, input: TInput }): Promise<TOutput> => {
    const agentContext = mustAgentContext(context);
    return fn({ context: agentContext, input: input });
  };
}
