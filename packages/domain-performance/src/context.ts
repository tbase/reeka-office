import type { MySql2Database } from 'drizzle-orm/mysql2'

import { apm, performanceDomainEvents } from './schema'

export type PerformanceSchema = {
  apm: typeof apm
  performanceDomainEvents: typeof performanceDomainEvents
}

export const performanceSchema: PerformanceSchema = {
  apm,
  performanceDomainEvents,
}

export type DB = MySql2Database<PerformanceSchema>
export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0]
export type DBExecutor = DB | Transaction

export interface SetupOptions {
  db: DB
}

function createContext({ db }: SetupOptions) {
  return { db }
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

export async function withTransaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
  return getDb().transaction(work)
}

export async function close() {
  if (!getContext()) {
    return
  }

  setContext(null)
}
