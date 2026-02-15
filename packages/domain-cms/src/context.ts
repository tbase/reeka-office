import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { categories, contents } from "./db/schema";

export type CmsSchema = {
  categories: typeof categories;
  contents: typeof contents;
};

export interface DBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export type DB = MySql2Database<CmsSchema>;

export interface SetupOptions {
  dbConfig: DBConfig;
}

function createContext({ dbConfig }: SetupOptions) {
  const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
  });

  const db: DB = drizzle(pool, {
    schema: { categories, contents },
    mode: "default",
  });

  return {
    db,
    async close() {
      await pool.end();
    },
  };
}

const GLOBAL_KEY = "__reeka_cms_context__" as const;

function getContext(): ReturnType<typeof createContext> | null {
  return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as ReturnType<typeof createContext> | null ?? null;
}

function setContext(ctx: ReturnType<typeof createContext> | null) {
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = ctx;
}

export function setup(options: SetupOptions) {
  if (getContext()) {
    throw new Error("CMS is already setup. Call close() before setup() again.");
  }

  const ctx = createContext(options);
  setContext(ctx);

  return {
    async close() {
      await close();
    },
  };
}

export function getDb(): DB {
  const ctx = getContext();
  if (!ctx) {
    throw new Error("CMS is not setup. Call setup({ dbURL }) first.");
  }

  return ctx.db;
}

export async function close() {
  const ctx = getContext();
  if (!ctx) {
    return;
  }

  setContext(null);
  await ctx.close();
}
