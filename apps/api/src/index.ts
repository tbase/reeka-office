import { type CmsDB, cmsSchema, setup as setupDomainCms } from "@reeka-office/domain-cms";
import { type NewbieDB, newbieSchema, setup as setupDomainNewbie } from "@reeka-office/domain-newbie";
import { type PointDB, pointSchema, setup as setupDomainPoint } from "@reeka-office/domain-point";
import { GetUserQuery, setup as setupDomainUser, type UserDB, userSchema } from "@reeka-office/domain-user";
import { handleRPC, RpcError, RpcErrorCode } from "@reeka-office/jsonrpc";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { config } from "./config";
import type { APIContext } from "./context";
import { registry } from "./registry";

async function createContext(req: Request): Promise<APIContext> {
  console.log("createContext", req.headers);
  const openid = req.headers.get("x-wx-openid") ?? req.headers.get("x-wx-from-openid");
  const envid = req.headers.get("x-wx-env");

  if (!envid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 envid");
  }
  if (!openid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 openid");
  }

  const clonedReq = req.clone();
  const body = await clonedReq.json();
  const method = body.method;

  if (method === "user/bindAgent") {
    return { openid, envid, user: null };
  }

  const user = await new GetUserQuery({ openid }).query();
  if (!user?.agentCode) {
    throw new RpcError(RpcErrorCode.FORBIDDEN, "非代理人，无访问权限");
  }

  return { openid, envid, user };
}



let pool: mysql.Pool | null = null;

interface DBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
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

export function createDb<TSchema extends Record<string, unknown>>(dbSchema: TSchema): MySql2Database<TSchema> {
  return drizzle(ensurePool(), {
    schema: dbSchema,
    mode: "default",
  });
}

const userDb = createDb(userSchema)
setupDomainUser({ db: userDb as unknown as UserDB })

const cmsDb = createDb(cmsSchema)
setupDomainCms({ db: cmsDb as unknown as CmsDB })

const pointDb = createDb(pointSchema)
setupDomainPoint({ db: pointDb as unknown as PointDB })

const newbieDb = createDb(newbieSchema)
setupDomainNewbie({ db: newbieDb as unknown as NewbieDB })

const server = Bun.serve({
  port: config.server.port,
  hostname: config.server.hostname,

  routes: {
    "/rpc": {
      POST: handleRPC(registry, { createContext }),
    },
  },
});

console.log(
  `🚀 API Server running at http://${server.hostname}:${server.port}`
);
console.log(`📡 RPC endpoint: POST /rpc`);
