import { identitySchema, setup as setupDomainIdentity, type IdentityDB } from '@reeka-office/domain-identity'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import { config } from './config'

let pool: mysql.Pool | null = null

function ensurePool(): mysql.Pool {
  if (pool) {
    return pool
  }

  pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
  })

  return pool
}

export function createDb<TSchema extends Record<string, unknown>>(schema: TSchema): MySql2Database<TSchema> {
  return drizzle(ensurePool(), {
    schema,
    mode: 'default',
  })
}

const identityDb = createDb(identitySchema)
setupDomainIdentity({ db: identityDb as IdentityDB })

export async function closeDb(): Promise<void> {
  if (!pool) {
    return
  }

  await pool.end()
  pool = null
}
