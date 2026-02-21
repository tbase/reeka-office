import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export type AdminSchema = typeof schema;

export type AdminDB = MySql2Database<AdminSchema>;

interface DBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

let pool: mysql.Pool | null = null;
let db: AdminDB | null = null;

function ensurePool(): mysql.Pool {
  if (pool) {
    return pool;
  }

  const config = getDBConfig();
  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  return pool;
}

export function getDBConfig(): DBConfig {
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? "3306", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}

export function initDB(): AdminDB {
  if (db) {
    return db;
  }

  db = createDb(schema);

  return db;
}

export function createDb<TSchema extends Record<string, unknown>>(dbSchema: TSchema): MySql2Database<TSchema> {
  return drizzle(ensurePool(), {
    schema: dbSchema,
    mode: "default",
  });
}

export function getDB(): AdminDB {
  if (!db) {
    return initDB();
  }
  return db;
}

export async function closeDB(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
