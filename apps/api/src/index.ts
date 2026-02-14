import { config } from "@/config"
import { handleRPC, RpcError, RpcErrorCode } from "@reeka-office/jsonrpc";
import { cmsRegistry } from "@/rpc/cms";

const createContext = (req: Request) => {
  const openid = req.headers.get("x-wx-openid");
  const envid = req.headers.get("x-wx-env");

  if (!envid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 envid");
  }
  if (!openid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 openid");
  }

  return { openid, envid };
};

const server = Bun.serve({
  port: config.server.port,
  hostname: config.server.hostname,

  routes: {
    "/rpc/cms": {
      POST: handleRPC(cmsRegistry, { createContext }),
    },
  },
});

console.log(
  `🚀 API Server running at http://${server.hostname}:${server.port}`
);
console.log(`📡 RPC endpoint: POST /rpc`);
