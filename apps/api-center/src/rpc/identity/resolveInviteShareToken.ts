import { ResolveInviteShareTokenQuery } from '@reeka-office/domain-identity'
import { RpcError, RpcErrorCode } from '@reeka-office/jsonrpc'
import { z } from 'zod'

import { rpc } from '../../context'

const inputSchema = z.object({
  shareToken: z.string().trim().min(1, '邀请链接无效'),
})

export type ResolveInviteShareTokenInput = z.infer<typeof inputSchema>
export type ResolveInviteShareTokenOutput = {
  shareToken: string
  tenantCode: string
  tenantName: string
  apiServiceName: string
  inviterAgentCode: string
  expiresAt: Date
  isExpired: boolean
}

export const resolveInviteShareToken = rpc.define({
  inputSchema,
  execute: async ({ input }) => {
    const invite = await new ResolveInviteShareTokenQuery({
      token: input.shareToken,
    }).query()

    if (!invite) {
      throw new RpcError(RpcErrorCode.BAD_REQUEST, '邀请链接不存在或已失效')
    }

    return {
      shareToken: invite.token,
      tenantCode: invite.tenantCode,
      tenantName: invite.tenantName,
      apiServiceName: invite.apiServiceName,
      inviterAgentCode: invite.inviterAgentCode,
      expiresAt: invite.expiresAt,
      isExpired: invite.isExpired,
    }
  },
})
