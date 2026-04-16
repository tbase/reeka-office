import { UnbindUserTenantCommand } from '@reeka-office/domain-identity'
import { z } from 'zod'

import { rpc } from '../../context'

const inputSchema = z.object({
  tenantCode: z.string().trim().min(1, '租户不能为空'),
})

export type UnbindTenantInput = z.infer<typeof inputSchema>

export const unbindTenant = rpc.define({
  inputSchema,
  execute: async ({ context, input }) => {
    return await new UnbindUserTenantCommand({
      openid: context.openid,
      tenantCode: input.tenantCode,
    }).execute()
  },
})
