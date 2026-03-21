import { identitySchema, type IdentityDB } from "@reeka-office/domain-identity"
import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"

let pool: mysql.Pool | null = null
let db: IdentityDB | null = null

interface DBConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

function getDBConfig(): DBConfig {
  return {
    host: process.env.CENTER_DB_HOST ?? process.env.DB_HOST,
    port: parseInt(process.env.CENTER_DB_PORT ?? process.env.DB_PORT ?? "3306", 10),
    user: process.env.CENTER_DB_USER ?? process.env.DB_USER,
    password: process.env.CENTER_DB_PASSWORD ?? process.env.DB_PASSWORD,
    database: process.env.CENTER_DB_NAME ?? process.env.DB_NAME,
  }
}

function ensurePool(): mysql.Pool {
  if (pool) {
    return pool
  }

  const config = getDBConfig()
  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
  })

  return pool
}

export function getIdentityDB(): IdentityDB {
  if (db) {
    return db
  }

  db = drizzle(ensurePool(), {
    schema: identitySchema,
    mode: "default",
  }) as IdentityDB

  return db
}

export async function closeIdentityDB(): Promise<void> {
  if (!pool) {
    return
  }

  await pool.end()
  pool = null
  db = null
}
