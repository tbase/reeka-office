import type { TenantSummary } from '../tenant-session'
import type { InviteInfo } from './center'

import { config } from '../config'
import { setActiveTenantCode, syncCachedTenants } from '../tenant-session'
import {
  createPayload,
  createRpcError,
  parseResponseData,
  parseRpcResponseOrThrow,
  requestJsonRpcTransport,
  RpcErrorCode,
} from './base'

export interface BindByInviteResponse {
  tenantCode: string
  agentId: number
  tenants: TenantSummary[]
}

export async function bindByShareToken(input: {
  shareToken: string
  agentCode: string
  joinMonth: string
  invite: InviteInfo
}): Promise<BindByInviteResponse> {
  const response = await requestJsonRpcTransport({
    path: '/invite-rpc',
    data: createPayload('invite/bindByShareToken', {
      shareToken: input.shareToken,
      agentCode: input.agentCode,
      joinMonth: input.joinMonth,
    }),
    serviceName: input.invite.apiServiceName,
    localUrl: config.TENANT_LOCAL_API ? `${config.TENANT_LOCAL_API}/invite-rpc` : undefined,
    localHeaders: {
      'X-WX-SERVICE': input.invite.apiServiceName,
    },
  })

  if (response.statusCode >= 400) {
    const payload = parseResponseData<{ message?: string }>(response.data)
    throw createRpcError(payload.message ?? '邀请绑定失败', RpcErrorCode.INTERNAL_ERROR)
  }

  const result = parseRpcResponseOrThrow<BindByInviteResponse>(response.data, '邀请绑定失败')

  syncCachedTenants(result.tenants)
  setActiveTenantCode(result.tenantCode)

  return result
}
