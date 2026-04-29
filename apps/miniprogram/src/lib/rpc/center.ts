import type { RpcErrorData } from '@reeka-office/jsonrpc'

import type { TenantSummary } from '../tenant-session'
import { config } from '../config'
import {
  activateTenant,
  getActiveTenant,
  getActiveTenantCode,
  getCachedTenants,
  setActiveTenantCode,
  syncCachedTenants,

} from '../tenant-session'
import {
  createPayload,
  createRpcError,
  parseResponseData,
  parseRpcResponseOrThrow,
  requestJsonRpcTransport,
} from './base'

interface CenterApiError extends Error {
  code?: number
  data?: RpcErrorData
  statusCode?: number
}

interface UnbindTenantResponse {
  tenantCode: string
  tenants: TenantSummary[]
}

export interface InviteInfo {
  shareToken: string
  tenantCode: string
  tenantName: string
  apiServiceName: string
  inviterAgentCode: string
  inviterName: string | null
  expiresAt: string
  isExpired: boolean
}

function createCenterApiError(
  message: string,
  statusCode?: number,
  code?: number,
  data?: RpcErrorData,
): CenterApiError {
  const error = createRpcError(message, code, data) as CenterApiError
  error.statusCode = statusCode
  return error
}

async function requestCenterApi<T>(method: string, params?: unknown): Promise<T> {
  const response = await requestJsonRpcTransport({
    path: '/rpc',
    data: createPayload(method, params),
    serviceName: config.CENTER_SERVICE_NAME,
    localUrl: config.CENTER_LOCAL_API ? `${config.CENTER_LOCAL_API}/rpc` : undefined,
  })

  if (response.statusCode >= 400) {
    const responsePayload = parseResponseData<{ message?: string }>(response.data)
    throw createCenterApiError(responsePayload.message ?? '中心服务请求失败', response.statusCode)
  }

  try {
    return parseRpcResponseOrThrow<T>(response.data, '中心服务请求失败')
  }
  catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw createCenterApiError('中心服务请求失败')
  }
}

export async function fetchMyTenants(): Promise<TenantSummary[]> {
  const response = await requestCenterApi<{ tenants: TenantSummary[] }>('identity/listMyTenants')
  return Array.isArray(response.tenants) ? response.tenants : []
}

export async function unbindTenant(tenantCode: string): Promise<UnbindTenantResponse> {
  const response = await requestCenterApi<UnbindTenantResponse>('identity/unbindTenant', {
    tenantCode,
  })

  const activeTenantCode = getActiveTenantCode()
  syncCachedTenants(response.tenants)
  if (activeTenantCode === response.tenantCode) {
    setActiveTenantCode(null)
  }

  return response
}

export async function resolveInviteShareToken(shareToken: string): Promise<InviteInfo> {
  const invite = await requestCenterApi<Omit<InviteInfo, 'inviterName'>>(
    'identity/resolveInviteShareToken',
    { shareToken },
  )

  return {
    ...invite,
    inviterName: null,
  }
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
  }
  catch {
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
  return `office-api-${tenantCode}`
}
