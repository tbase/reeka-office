import type { RpcMethod } from "@reeka-office/jsonrpc";
import { getCurrentUser } from "./getCurrentUser";

export const userRegistry: Record<string, RpcMethod> = {
  getCurrentUser,
}
