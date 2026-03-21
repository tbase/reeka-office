import { createRpc } from '@reeka-office/jsonrpc'

export type APICenterContext = {
  openid: string
  envid: string
}

export const rpc = createRpc<APICenterContext>()
