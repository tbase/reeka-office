import { BindUserByTokenCommand } from '@reeka-office/domain-identity'
import { z } from 'zod'

import { rpc } from '../../context'

const inputSchema = z.object({
  token: z.string().trim().min(1, '绑定码不能为空'),
})

export type BindByTokenInput = z.infer<typeof inputSchema>

export const bindByToken = rpc.define({
  inputSchema,
  execute: async ({ context, input }) => {
    return await new BindUserByTokenCommand({
      openid: context.openid,
      token: input.token,
    }).execute()
  },
})
