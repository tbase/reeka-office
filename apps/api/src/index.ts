import { handleRPC, RpcError, RpcErrorCode, type RpcMethod } from "@reeka-office/jsonrpc";

import { config } from "@/config"
import { cmsRegistry } from "@/rpc/cms";
import { userRegistry } from "@/rpc/user";

type RequestContext = {
  openid: string;
  envid: string;
};

function createContext(req: Request): RequestContext {
  const openid = req.headers.get("x-wx-openid");
  const envid = req.headers.get("x-wx-env");

  if (!envid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 envid");
  }
  if (!openid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 openid");
  }

  return { openid, envid };
}

function prefixRegistry(
  prefix: string,
  methods: Record<string, RpcMethod<unknown>>,
): Record<string, RpcMethod<unknown>> {
  const result: Record<string, RpcMethod<unknown>> = {};

  for (const [key, method] of Object.entries(methods)) {
    result[`${prefix}/${key}`] = method;
  }

  return result;
}

const registry: Record<string, RpcMethod<unknown>> = {
  ...prefixRegistry("cms", cmsRegistry),
  ...prefixRegistry("user", userRegistry),
};

const server = Bun.serve({
  port: config.server.port,
  hostname: config.server.hostname,

  routes: {
    "/rpc": {
      POST: handleRPC(registry, { createContext }),
    },
  },
});

console.log(
  `🚀 API Server running at http://${server.hostname}:${server.port}`
);
console.log(`📡 RPC endpoint: POST /rpc`);
