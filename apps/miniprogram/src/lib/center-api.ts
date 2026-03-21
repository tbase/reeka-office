import { getCloudInstance } from './cloud'
import { config } from './config'
import {
  activateTenant,
  getActiveTenant,
  getActiveTenantCode,
  getCachedTenants,
  setActiveTenantCode,
  syncCachedTenants,
  type TenantSummary,
} from './tenant-session'

interface CenterApiError extends Error {
  code?: number
  data?: unknown
  statusCode?: number
}

interface JsonRpcResponse<T> {
  jsonrpc: '2.0'
  result?: T
  error?: { code: number; message: string; data?: unknown }
  id: string | number | null
}

interface BindByTokenResponse {
  userId: number
  tenantCode: string
  agentId: number
  tenants: TenantSummary[]
}

function createCenterApiError(
  message: string,
  statusCode?: number,
  code?: number,
  data?: unknown,
): CenterApiError {
  const error = new Error(message) as CenterApiError
  error.code = code
  error.data = data
  error.statusCode = statusCode
  return error
}

function parseResponseData<T>(data: unknown): T {
  if (typeof data === 'string') {
    return JSON.parse(data) as T
  }

  return data as T
}

function parseRpcResponse<T>(payload: unknown): T {
  const response = parseResponseData<JsonRpcResponse<T>>(payload)

  if (response?.error) {
    throw createCenterApiError(
      response.error.message ?? '中心服务请求失败',
      200,
      response.error.code,
      response.error.data,
    )
  }

  if (response?.result === undefined) {
    throw createCenterApiError('中心服务响应格式错误', 200)
  }

  return response.result
}

async function requestCenterApi<T>(method: string, params?: unknown): Promise<T> {
  const payload = {
    jsonrpc: '2.0' as const,
    method,
    params,
    id: Date.now(),
  }

  if (config.CENTER_LOCAL_API) {
    return requestCenterLocalApi<T>(payload)
  }

  const instance = await getCloudInstance()
  const response = await instance.callContainer({
    path: '/rpc',
    method: 'POST',
    header: {
      'X-WX-SERVICE': config.CENTER_SERVICE_NAME,
      'Content-Type': 'application/json',
    },
    data: payload,
  })

  if (response.statusCode >= 400) {
    const responsePayload = parseResponseData<{ message?: string }>(response.data)
    throw createCenterApiError(responsePayload.message ?? '中心服务请求失败', response.statusCode)
  }

  return parseRpcResponse<T>(response.data)
}

function requestCenterLocalApi<T>(data: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.CENTER_LOCAL_API!}/rpc`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-WX-OPENID': config.LOCAL_OPENID!,
        'X-WX-ENV': config.LOCAL_ENV ?? 'local',
      },
      data: JSON.stringify(data),
      success: (response) => {
        if (response.statusCode >= 400) {
          const payload = parseResponseData<{ message?: string }>(response.data)
          reject(createCenterApiError(payload.message ?? '中心服务请求失败', response.statusCode))
          return
        }

        resolve(parseRpcResponse<T>(response.data))
      },
      fail: (error) => {
        reject(error)
      },
    })
  })
}

export async function fetchMyTenants(): Promise<TenantSummary[]> {
  const response = await requestCenterApi<{ tenants: TenantSummary[] }>('identity/listMyTenants')
  return Array.isArray(response.tenants) ? response.tenants : []
}

export async function bindByToken(token: string): Promise<BindByTokenResponse> {
  const response = await requestCenterApi<BindByTokenResponse>('identity/bindByToken', {
    token,
  })

  syncCachedTenants(response.tenants)
  setActiveTenantCode(response.tenantCode)

  return response
}

export async function refreshTenantCatalog(): Promise<{
  tenants: TenantSummary[]
  activeTenant: TenantSummary | null
}> {
  const tenants = await fetchMyTenants()
  const activeTenant = syncCachedTenants(tenants)

  return {
    tenants,
    activeTenant,
  }
}

export async function hydrateTenantCatalog(): Promise<{
  tenants: TenantSummary[]
  activeTenant: TenantSummary | null
}> {
  try {
    return await refreshTenantCatalog()
  } catch {
    return {
      tenants: getCachedTenants(),
      activeTenant: getActiveTenant(),
    }
  }
}

export function switchTenant(tenantCode: string): TenantSummary | null {
  const tenant = activateTenant(tenantCode)
  return tenant ?? null
}

export function getTenantServiceName(): string {
  const tenantCode = getActiveTenantCode()
  if (!tenantCode) {
    throw createCenterApiError('当前租户已失效，请重新选择租户')
  }
  return `${tenantCode}-office-api`
}
