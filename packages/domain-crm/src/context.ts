import type { MySql2Database } from 'drizzle-orm/mysql2'

import {
  crmCustomerProfileValues,
  crmCustomers,
  crmCustomerTypes,
  crmFollowUpRecords,
  crmProfileFields,
} from './schema'

export type CrmSchema = {
  crmCustomerTypes: typeof crmCustomerTypes
  crmProfileFields: typeof crmProfileFields
  crmCustomers: typeof crmCustomers
  crmCustomerProfileValues: typeof crmCustomerProfileValues
  crmFollowUpRecords: typeof crmFollowUpRecords
}

export const crmSchema: CrmSchema = {
  crmCustomerTypes,
  crmProfileFields,
  crmCustomers,
  crmCustomerProfileValues,
  crmFollowUpRecords,
}

export type DB = MySql2Database<CrmSchema>
export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0]
export type DBExecutor = DB | Transaction

export interface SetupOptions {
  db: DB
}

function createContext({ db }: SetupOptions) {
  return { db }
}

const GLOBAL_KEY = '__reeka_crm_context__' as const

function getContext(): ReturnType<typeof createContext> | null {
  return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as ReturnType<typeof createContext> | null ?? null
}

function setContext(ctx: ReturnType<typeof createContext> | null) {
  ;(globalThis as Record<string, unknown>)[GLOBAL_KEY] = ctx
}

export function setup(options: SetupOptions) {
  if (getContext()) {
    throw new Error('CRM domain is already setup. Call close() before setup() again.')
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
    throw new Error('CRM domain is not setup. Call setup({ db }) first.')
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
