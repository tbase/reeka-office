import type { MySql2Database } from 'drizzle-orm/mysql2'

import { apm } from './schema'

export type PerformanceSchema = {
  apm: typeof apm
}

export const performanceSchema: PerformanceSchema = {
  apm,
}

export type DB = MySql2Database<PerformanceSchema>

export interface SetupOptions {
  db: DB
}

function createContext({ db }: SetupOptions) {
  return {
    db,
  }
}

const GLOBAL_KEY = '__reeka_performance_context__' as const

function getContext(): ReturnType<typeof createContext> | null {
  return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as ReturnType<typeof createContext> | null ?? null
}

function setContext(ctx: ReturnType<typeof createContext> | null) {
  ;(globalThis as Record<string, unknown>)[GLOBAL_KEY] = ctx
}

export function setup(options: SetupOptions) {
  if (getContext()) {
    throw new Error('Performance domain is already setup. Call close() before setup() again.')
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
    throw new Error('Performance domain is not setup. Call setup({ db }) first.')
  }

  return ctx.db
}

export async function close() {
  if (!getContext()) {
    return
  }

  setContext(null)
}
