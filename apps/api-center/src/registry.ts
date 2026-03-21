import { rpc } from './context'
import { bindByToken, listMyTenants } from './rpc/identity'

type PrefixKeys<P extends string, T> = {
  [K in keyof T as K extends string ? `${P}/${K}` : never]: T[K]
}

function prefixRegistry<P extends string, T extends Record<string, unknown>>(
  prefix: P,
  methods: T,
): PrefixKeys<P, T> {
  const result: Record<string, unknown> = {}

  for (const [key, method] of Object.entries(methods)) {
    result[`${prefix}/${key}`] = method
  }

  return result as PrefixKeys<P, T>
}

const identityRegistry = rpc.registry({
  bindByToken,
  listMyTenants,
})

export const registry = {
  ...prefixRegistry('identity', identityRegistry),
}

export type APICenterRegistry = typeof registry
