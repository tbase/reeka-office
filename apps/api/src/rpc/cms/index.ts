import type { RpcMethod } from "@reeka-office/jsonrpc";
import { listServiceCategories } from "./listServiceCategories";

export const cmsRegistry: Record<string, RpcMethod> = {
  listServiceCategories,
}
