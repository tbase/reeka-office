import type { RpcInput, RpcMethodName, RpcOutput } from '@rpc-types'
import type { JsonRpcResponse, RpcError, RpcResult } from './base'

import { config } from '../config'
import {
  createPayload,
  createRpcError,
  parseRpcErrorData,
  parseRpcResult,
  requestJsonRpcTransport,
  RpcErrorCode,
} from './base'
import { getTenantServiceName } from './center'

type RpcGlobalErrorHandler = (error: RpcError, method: RpcMethodName) => void
let globalRpcErrorHandler: RpcGlobalErrorHandler | undefined

export function setRpcErrorHandler(handler: RpcGlobalErrorHandler): void {
  globalRpcErrorHandler = handler
}

export async function rpc<M extends RpcMethodName>(
  method: M,
  ...args: RpcInput<M> extends void ? [] : [params: RpcInput<M>]
): Promise<RpcResult<RpcOutput<M>>> {
  const params = args[0]

  try {
    const res = await callTenantRpc(createPayload(method, params))
    if (res.statusCode !== 200) {
      return {
        success: false,
        error: createRpcError(`HTTP ${res.statusCode}`, RpcErrorCode.INTERNAL_ERROR),
      }
    }

    const response = res.data as JsonRpcResponse<RpcOutput<M>>
    const result = parseRpcResult(response)
    if (!result.success) {
      globalRpcErrorHandler?.(result.error, method)
    }
    return result
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : '网络错误'
    const rpcError = createRpcError(
      message,
      error instanceof Error && 'code' in error && typeof error.code === 'number'
        ? error.code
        : RpcErrorCode.NETWORK_ERROR,
      error instanceof Error && 'data' in error ? parseRpcErrorData(error.data) : undefined,
    )
    globalRpcErrorHandler?.(rpcError, method)
    return { success: false, error: rpcError }
  }
}

function callTenantRpc(data: unknown) {
  const serviceName = getTenantServiceName()
  return requestJsonRpcTransport({
    path: '/rpc',
    data,
    serviceName,
    localUrl: config.TENANT_LOCAL_API ? `${config.TENANT_LOCAL_API}/rpc` : undefined,
    localHeaders: {
      'X-WX-SERVICE': serviceName,
    },
  })
}

export interface BatchRpcCall<M extends RpcMethodName = RpcMethodName> {
  method: M
  params?: RpcInput<M>
}

export type BatchRpcResult<T = unknown>
  = | { success: true, data: T }
    | { success: false, error: RpcError }

export async function rpcBatch<Calls extends readonly BatchRpcCall[]>(
  calls: Calls,
): Promise<{
  [K in keyof Calls]: Calls[K] extends BatchRpcCall<infer M>
    ? BatchRpcResult<RpcOutput<M>>
    : never
}> {
  const timestamp = Date.now()
  const requestData = calls.map((call, index) => ({
    jsonrpc: '2.0' as const,
    method: call.method,
    params: call.params,
    id: `${timestamp}_${index}`,
  }))

  try {
    const res = await callTenantRpc(requestData)

    if (res.statusCode !== 200) {
      const error = createRpcError(`HTTP ${res.statusCode}`, RpcErrorCode.INTERNAL_ERROR)
      return calls.map(() => ({ success: false as const, error })) as {
        [K in keyof Calls]: Calls[K] extends BatchRpcCall<infer M>
          ? BatchRpcResult<RpcOutput<M>>
          : never
      }
    }

    const responses = res.data as JsonRpcResponse<unknown>[]
    const responseMap = new Map<string | number | null, JsonRpcResponse<unknown>>()
    for (const response of responses) {
      responseMap.set(response.id, response)
    }

    return requestData.map((req) => {
      const response = responseMap.get(req.id)

      if (!response) {
        return {
          success: false as const,
          error: createRpcError(
            `响应缺失：${req.method}`,
            RpcErrorCode.INTERNAL_ERROR,
          ),
        }
      }

      if (response.error) {
        return {
          success: false as const,
          error: createRpcError(
            response.error.message || 'RPC 调用失败',
            response.error.code,
            response.error.data,
          ),
        }
      }

      return { success: true as const, data: response.result }
    }) as {
      [K in keyof Calls]: Calls[K] extends BatchRpcCall<infer M>
        ? BatchRpcResult<RpcOutput<M>>
        : never
    }
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : '网络错误'
    const rpcError = createRpcError(message, RpcErrorCode.NETWORK_ERROR)
    return calls.map(() => ({ success: false as const, error: rpcError })) as {
      [K in keyof Calls]: Calls[K] extends BatchRpcCall<infer M>
        ? BatchRpcResult<RpcOutput<M>>
        : never
    }
  }
}
