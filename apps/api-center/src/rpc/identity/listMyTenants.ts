import { ListUserTenantsQuery } from '@reeka-office/domain-identity'
import { z } from 'zod'

import { rpc } from '../../context'

const inputSchema = z.void()

export type ListMyTenantsInput = z.infer<typeof inputSchema>

export const listMyTenants = rpc.define({
  inputSchema,
  execute: async ({ context }) => {
    return {
      tenants: await new ListUserTenantsQuery({ openid: context.openid }).query(),
    }
  },
})
