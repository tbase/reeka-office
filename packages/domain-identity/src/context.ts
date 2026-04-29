import type { MySql2Database } from 'drizzle-orm/mysql2'

import {
  bindingTokens,
  inviteShareTokens,
  tenants,
  userTenantBindings,
  users,
} from './db/schema'

export type IdentitySchema = {
  tenants: typeof tenants
  users: typeof users
  userTenantBindings: typeof userTenantBindings
  bindingTokens: typeof bindingTokens
  inviteShareTokens: typeof inviteShareTokens
}

export const identitySchema: IdentitySchema = {
  tenants,
  users,
  userTenantBindings,
  bindingTokens,
  inviteShareTokens,
}

export type DB = MySql2Database<IdentitySchema>

export interface SetupOptions {
  db: DB
}

type IdentityContext = {
  db: DB
}

function createContext({ db }: SetupOptions): IdentityContext {
  return { db }
}

const GLOBAL_KEY = '__reeka_identity_context__' as const

function getContext(): IdentityContext | null {
  const value = (globalThis as Record<string, unknown>)[GLOBAL_KEY]
  return (value as IdentityContext | null) ?? null
}

function setContext(ctx: IdentityContext | null): void {
  ;(globalThis as Record<string, unknown>)[GLOBAL_KEY] = ctx
}

export function setup(options: SetupOptions): { close: () => Promise<void> } {
  if (getContext()) {
    throw new Error('Identity domain is already setup. Call close() before setup() again.')
  }

  setContext(createContext(options))

  return {
    async close() {
      await close()
    },
  }
}

export function getDb(): DB {
  const ctx = getContext()
  if (!ctx) {
    throw new Error('Identity domain is not setup. Call setup({ db }) first.')
  }

  return ctx.db
}

export async function close(): Promise<void> {
  if (!getContext()) {
    return
  }

  setContext(null)
}
