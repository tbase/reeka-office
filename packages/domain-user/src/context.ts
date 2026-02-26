import type { MySql2Database } from 'drizzle-orm/mysql2'
import { agents, users } from './db/schema'

export type UserSchema = {
  users: typeof users
  agents: typeof agents
}

export const userSchema: UserSchema = {
  users,
  agents,
}

export type DB = MySql2Database<UserSchema>

export interface SetupOptions {
  db: MySql2Database<UserSchema>
}

type UserContext = {
  db: DB
}

function createContext({ db }: SetupOptions): UserContext {
  return {
    db,
  }
}

const GLOBAL_KEY = '__reeka_user_context__' as const

function getContext(): UserContext | null {
  const value = (globalThis as Record<string, unknown>)[GLOBAL_KEY]
  return (value as UserContext | null) ?? null
}

function setContext(ctx: UserContext | null): void {
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = ctx
}

export function setup(options: SetupOptions): { close: () => Promise<void> } {
  if (getContext()) {
    throw new Error('User domain is already setup. Call close() before setup() again.')
  }

  const ctx = createContext(options)
  setContext(ctx)

  return {
    async close() {
      await close()
    },
  }
}

export function getDb(): DB {
  const ctx = getContext()
  if (!ctx) {
    throw new Error('User domain is not setup. Call setup({ db }) first.')
  }

  return ctx.db
}

export async function close(): Promise<void> {
  const ctx = getContext()
  if (!ctx) {
    return
  }

  setContext(null)
}
