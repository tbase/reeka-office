import type { MySql2Database } from 'drizzle-orm/mysql2'
import { agents } from './db/schema'

export type AgentSchema = {
  agents: typeof agents
}

export const agentSchema: AgentSchema = {
  agents,
}

export type DB = MySql2Database<AgentSchema>

export interface SetupOptions {
  db: MySql2Database<AgentSchema>
}

type AgentContext = {
  db: DB
}

function createContext({ db }: SetupOptions): AgentContext {
  return {
    db,
  }
}

const GLOBAL_KEY = '__reeka_agent_context__' as const

function getContext(): AgentContext | null {
  const value = (globalThis as Record<string, unknown>)[GLOBAL_KEY]
  return (value as AgentContext | null) ?? null
}

function setContext(ctx: AgentContext | null): void {
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = ctx
}

export function setup(options: SetupOptions): { close: () => Promise<void> } {
  if (getContext()) {
    throw new Error('Agent domain is already setup. Call close() before setup() again.')
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
    throw new Error('Agent domain is not setup. Call setup({ db }) first.')
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
