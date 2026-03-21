import { RpcError, RpcErrorCode, handleRPC } from '@reeka-office/jsonrpc'

import { config } from './config'
import './db'
import type { APICenterContext } from './context'
import { registry } from './registry'

async function createContext(req: Request): Promise<APICenterContext> {
  const openid = req.headers.get('x-wx-openid') ?? req.headers.get('x-wx-from-openid')
  const envid = req.headers.get('x-wx-env')

  if (!openid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, '缺少 openid')
  }

  if (!envid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, '缺少 envid')
  }

  return {
    openid,
    envid,
  }
}

const server = Bun.serve({
  port: config.server.port,
  hostname: config.server.hostname,
  routes: {
    '/rpc': {
      POST: handleRPC(registry, { createContext }),
    },
  },
})

console.log(`🚀 Center API running at http://${server.hostname}:${server.port}`)
console.log(`📡 RPC endpoint: POST /rpc`)
