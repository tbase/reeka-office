import type { MySql2Database } from 'drizzle-orm/mysql2'

import {
  planCompletedTasks,
  planDomainEvents,
  planEnrollments,
  plans,
  planStages,
  planTaskCategories,
  planTasks,
} from './schema'

export type PlanSchema = {
  plans: typeof plans
  planStages: typeof planStages
  planTaskCategories: typeof planTaskCategories
  planTasks: typeof planTasks
  planEnrollments: typeof planEnrollments
  planCompletedTasks: typeof planCompletedTasks
  planDomainEvents: typeof planDomainEvents
}

export const planSchema: PlanSchema = {
  plans,
  planStages,
  planTaskCategories,
  planTasks,
  planEnrollments,
  planCompletedTasks,
  planDomainEvents,
}

export type DB = MySql2Database<PlanSchema>
export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0]
export type DBExecutor = DB | Transaction

export interface SetupOptions {
  db: DB
}

function createContext({ db }: SetupOptions) {
  return { db }
}

const GLOBAL_KEY = '__reeka_plan_context__' as const

function getContext(): ReturnType<typeof createContext> | null {
  return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as ReturnType<typeof createContext> | null ?? null
}

function setContext(ctx: ReturnType<typeof createContext> | null) {
  ;(globalThis as Record<string, unknown>)[GLOBAL_KEY] = ctx
}

export function setup(options: SetupOptions) {
  if (getContext()) {
    throw new Error('Plan domain is already setup. Call close() before setup() again.')
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
    throw new Error('Plan domain is not setup. Call setup({ db }) first.')
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
