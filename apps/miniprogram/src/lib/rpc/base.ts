import type { RpcErrorData } from '@reeka-office/jsonrpc'

import { getCloudInstance } from '../cloud'
import { config } from '../config'

export interface JsonRpcResponse<T> {
  jsonrpc: '2.0'
  result?: T
  error?: { code: number, message: string, data?: RpcErrorData }
  id: string | number | null
}

export interface RpcTransportResponse {
  statusCode: number
  data: unknown
}

export interface RpcError extends Error {
  code?: number
  data?: RpcErrorData
}

export type RpcResult<T>
  = | { success: true, data: T }
    | { success: false, error: RpcError }

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

export function parseRpcErrorData(data: unknown): RpcErrorData | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined
  }

  const candidate = data as Partial<RpcErrorData>

  if (candidate.kind === 'business' && typeof candidate.reason === 'string') {
    return candidate as RpcErrorData
  }

  if (candidate.kind === 'internal' && typeof candidate.requestId === 'string') {
    return candidate as RpcErrorData
  }

  if (candidate.kind === 'validation' && Array.isArray(candidate.issues)) {
    return candidate as RpcErrorData
  }

  return undefined
}

export function createRpcError(
  message: string,
  code?: number,
  data?: RpcErrorData,
): RpcError {
  const error: RpcError = new Error(message)
  error.code = code
  error.data = data
  return error
}

export function parseResponseData<T>(data: unknown): T {
  if (typeof data === 'string') {
    return JSON.parse(data) as T
  }

  return data as T
}

export function parseRpcResult<T>(response: JsonRpcResponse<T>): RpcResult<T> {
  if (response.error) {
    return {
      success: false,
      error: createRpcError(
        response.error.message || 'RPC 调用失败',
        response.error.code,
        response.error.data,
      ),
    }
  }

  if (response.result === undefined) {
    return {
      success: false,
      error: createRpcError('响应格式错误：缺少 result', RpcErrorCode.INTERNAL_ERROR),
    }
  }

  return { success: true, data: response.result }
}

export function parseRpcResponseOrThrow<T>(payload: unknown, fallbackMessage: string): T {
  const response = parseResponseData<JsonRpcResponse<T>>(payload)

  if (response?.error) {
    throw createRpcError(
      response.error.message ?? fallbackMessage,
      response.error.code,
      response.error.data,
    )
  }

  if (response?.result === undefined) {
    throw createRpcError('RPC 响应格式错误', RpcErrorCode.INTERNAL_ERROR)
  }

  return response.result
}

export function createPayload(method: string, params?: unknown) {
  return {
    jsonrpc: '2.0' as const,
    method,
    params,
    id: Date.now(),
  }
}

export async function requestJsonRpcTransport(input: {
  path: string
  data: unknown
  serviceName?: string
  localUrl?: string
  localHeaders?: Record<string, string>
}): Promise<RpcTransportResponse> {
  if (input.localUrl) {
    return requestLocalJsonRpc(input.localUrl, input.data, input.localHeaders)
  }

  if (!input.serviceName) {
    throw createRpcError('缺少服务名称', RpcErrorCode.INTERNAL_ERROR)
  }

  const instance = await getCloudInstance()
  const response = await instance.callContainer({
    path: input.path,
    method: 'POST',
    header: {
      'X-WX-SERVICE': input.serviceName,
      'Content-Type': 'application/json',
    },
    data: input.data,
  })

  return {
    statusCode: response.statusCode,
    data: response.data,
  }
}

function requestLocalJsonRpc(
  url: string,
  data: unknown,
  headers: Record<string, string> = {},
): Promise<RpcTransportResponse> {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-WX-OPENID': config.LOCAL_OPENID!,
        'X-WX-ENV': config.LOCAL_ENV ?? 'local',
        ...headers,
      },
      data: JSON.stringify(data),
      success: (response) => {
        resolve({
          statusCode: response.statusCode,
          data: response.data,
        })
      },
      fail: (error) => {
        reject(error)
      },
    })
  })
}
