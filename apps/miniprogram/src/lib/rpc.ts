import type { RpcMethodName, RpcInput, RpcOutput } from "@rpc-types"

interface JsonRpcResponse<T> {
  jsonrpc: "2.0"
  result?: T
  error?: { code: number; message: string; data?: unknown }
  id: string | number | null
}

export interface RpcError extends Error {
  code?: number
  data?: unknown
}

// RPC 调用结果类型（discriminated union）
export type RpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: RpcError }

// RPC 错误码常量
export const RpcErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  FORBIDDEN: -32002,
  NOT_FOUND: -32003,
  BAD_REQUEST: -32004,
  NETWORK_ERROR: -32000,
} as const

type RpcGlobalErrorHandler = (error: RpcError, method: RpcMethodName) => void
let globalRpcErrorHandler: RpcGlobalErrorHandler | undefined

export function setRpcErrorHandler(handler: RpcGlobalErrorHandler): void {
  globalRpcErrorHandler = handler
}

// 共享 HTTP 配置
const RPC_CONFIG = {
  path: "/rpc",
  method: "POST" as const,
  header: {
    "X-WX-SERVICE": "reeka-office-api",
    "Content-Type": "application/json",
  },
}

const CLOUD_ENV = 'prod-5gnkpz4fe2b43d19'
const CLOUD_APPID = 'wxb1526d775ae0d63e'

let cloudInstance: WxCloud | undefined = undefined
export const getInstance = async (): Promise<WxCloud> => {
  if (cloudInstance) {
    return cloudInstance
  }
  // @ts-ignore
  const instance = new wx.cloud.Cloud({
    resourceAppid: CLOUD_APPID,
    resourceEnv: CLOUD_ENV,
  });
  await instance.init()
  cloudInstance = instance
  return instance
}


function createRpcError(
  message: string,
  code?: number,
  data?: unknown
): RpcError {
  const error: RpcError = new Error(message)
  error.code = code
  error.data = data
  return error
}

function parseResponse<T>(response: JsonRpcResponse<T>): RpcResult<T> {
  if (response.error) {
    return {
      success: false,
      error: createRpcError(
        response.error.message || "RPC 调用失败",
        response.error.code,
        response.error.data
      ),
    }
  }

  if (response.result === undefined) {
    return {
      success: false,
      error: createRpcError("响应格式错误：缺少 result", RpcErrorCode.INTERNAL_ERROR),
    }
  }

  return { success: true, data: response.result }
}

/**
 * 类型安全的 RPC 调用
 * @param method RPC 方法名
 * @param params 方法参数（可选，根据方法定义）
 * @returns Promise<RpcResult<方法返回值>>
 */
export async function rpc<M extends RpcMethodName>(
  method: M,
  ...args: RpcInput<M> extends void ? [] : [params: RpcInput<M>]
): Promise<RpcResult<RpcOutput<M>>> {
  const params = args[0]

  try {
    const instance = await getInstance()
    const res = await instance.callContainer({
      ...RPC_CONFIG,
      data: {
        jsonrpc: "2.0",
        method,
        params,
        id: Date.now(),
      },
    })

    if (res.statusCode !== 200) {
      return {
        success: false,
        error: createRpcError(`HTTP ${res.statusCode}`, RpcErrorCode.INTERNAL_ERROR),
      }
    }

    const response = res.data as JsonRpcResponse<RpcOutput<M>>
    const result = parseResponse(response)
    if (!result.success) {
      globalRpcErrorHandler?.(result.error, method)
    }
    return result
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "网络错误"
    const rpcError = createRpcError(message, RpcErrorCode.NETWORK_ERROR)
    globalRpcErrorHandler?.(rpcError, method)
    return { success: false, error: rpcError }
  }
}

/**
 * 批量 RPC 调用请求项
 */
export interface BatchRpcCall<M extends RpcMethodName = RpcMethodName> {
  method: M
  params?: RpcInput<M>
}

/**
 * 批量 RPC 调用结果项（discriminated union）
 */
export type BatchRpcResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: RpcError }

/**
 * 批量 RPC 调用（JSON-RPC 2.0 batch request）
 * 
 * 改进：通过 id 匹配响应，不依赖服务器返回顺序
 * 
 * @param calls 批量调用请求数组
 * @returns Promise<批量调用结果数组>
 */
export async function rpcBatch<Calls extends readonly BatchRpcCall[]>(
  calls: Calls
): Promise<{
  [K in keyof Calls]: Calls[K] extends BatchRpcCall<infer M>
    ? BatchRpcResult<RpcOutput<M>>
    : never
}> {
  const timestamp = Date.now()
  const requestData = calls.map((call, index) => ({
    jsonrpc: "2.0" as const,
    method: call.method,
    params: call.params,
    id: `${timestamp}_${index}`,
  }))

  try {
    const instance = await getInstance()
    const res = await instance.callContainer({
      ...RPC_CONFIG,
      data: requestData,
    })

    if (res.statusCode !== 200) {
      const error = createRpcError(`HTTP ${res.statusCode}`, RpcErrorCode.INTERNAL_ERROR)
      return calls.map(() => ({ success: false as const, error })) as {
        [K in keyof Calls]: Calls[K] extends BatchRpcCall<infer M>
          ? BatchRpcResult<RpcOutput<M>>
          : never
      }
    }

    // 构建 id -> response 映射，按 id 匹配响应（JSON-RPC 2.0 不保证顺序）
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
            RpcErrorCode.INTERNAL_ERROR
          ),
        }
      }

      if (response.error) {
        return {
          success: false as const,
          error: createRpcError(
            response.error.message || "RPC 调用失败",
            response.error.code,
            response.error.data
          ),
        }
      }

      return { success: true as const, data: response.result }
    }) as {
      [K in keyof Calls]: Calls[K] extends BatchRpcCall<infer M>
        ? BatchRpcResult<RpcOutput<M>>
        : never
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "网络错误"
    const rpcError = createRpcError(message, RpcErrorCode.NETWORK_ERROR)
    return calls.map(() => ({ success: false as const, error: rpcError })) as {
      [K in keyof Calls]: Calls[K] extends BatchRpcCall<infer M>
        ? BatchRpcResult<RpcOutput<M>>
        : never
    }
  }
}

// 重新导出类型，方便使用
export type { RpcMethodName, RpcInput, RpcOutput } from "@rpc-types"
