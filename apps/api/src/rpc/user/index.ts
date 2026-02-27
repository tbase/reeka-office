import type { RpcMethod } from "@reeka-office/jsonrpc";
import { bindAgent } from "./bindAgent";
import { getCurrentUser } from "./getCurrentUser";

export const userRegistry: Record<string, RpcMethod> = {
  bindAgent,
  getCurrentUser,
}
