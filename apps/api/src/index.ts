import { type CmsDB, cmsSchema, setup as setupDomainCms } from "@reeka-office/domain-cms";
import {
  ResolveTenantAgentByOpenIdQuery,
  identitySchema,
  setup as setupDomainIdentity,
  type IdentityDB,
} from "@reeka-office/domain-identity";
import {
  crmSchema,
  setup as setupDomainCrm,
  type CrmDB,
} from "@reeka-office/domain-crm";
import {
  performanceSchema,
  setup as setupDomainPerformance,
  type PerformanceDB,
} from "@reeka-office/domain-performance";
import { GetAgentQuery, agentSchema, setup as setupDomainAgent, type AgentDB } from "@reeka-office/domain-agent";
import { type PointDB, pointSchema, setup as setupDomainPoint } from "@reeka-office/domain-point";
import { handleRPC, RpcError, RpcErrorCode } from "@reeka-office/jsonrpc";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { config } from "./config";
import type { APIContext } from "./context";
import { inviteRegistry } from "./invite-registry";
import { registry } from "./registry";

async function createContext(req: Request): Promise<APIContext> {
  const openid = req.headers.get("x-wx-openid") ?? req.headers.get("x-wx-from-openid");
  const envid = req.headers.get("x-wx-env");
  const tenantCode = config.tenantCode?.trim();

  if (!envid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 envid");
  }
  if (!openid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 openid");
  }
  if (!tenantCode) {
    throw new RpcError(RpcErrorCode.INTERNAL_ERROR, "缺少 tenant code");
  }

  const resolvedUser = await new ResolveTenantAgentByOpenIdQuery({
    openid,
    tenantCode,
  }).query();
  if (!resolvedUser?.agentId) {
    throw new RpcError(RpcErrorCode.FORBIDDEN, "非代理人，无访问权限");
  }

  const agent = await new GetAgentQuery({ agentId: resolvedUser.agentId }).query();
  if (!agent) {
    throw new RpcError(RpcErrorCode.FORBIDDEN, "代理人不存在，无访问权限");
  }

  return {
    openid,
    envid,
    user: {
      id: resolvedUser.userId,
      openid: resolvedUser.openid,
      nickname: resolvedUser.nickname,
      avatar: resolvedUser.avatar,
      agentId: agent.id,
      agentCode: agent.agentCode,
      agentName: agent.name,
      createdAt: resolvedUser.createdAt,
      updatedAt: resolvedUser.updatedAt,
    },
  };
}

async function createPublicContext(req: Request): Promise<APIContext> {
  const openid = req.headers.get("x-wx-openid") ?? req.headers.get("x-wx-from-openid");
  const envid = req.headers.get("x-wx-env");

  if (!envid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 envid");
  }
  if (!openid) {
    throw new RpcError(RpcErrorCode.INVALID_REQUEST, "缺少 openid");
  }

  return {
    openid,
    envid,
    user: null,
  };
}

let businessPool: mysql.Pool | null = null;
let identityPool: mysql.Pool | null = null;

interface DBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function getBusinessDBConfig(): DBConfig {
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? "3306", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}

export function getIdentityDBConfig(): DBConfig {
  return {
    host: process.env.CENTER_DB_HOST ?? process.env.DB_HOST,
    port: parseInt(process.env.CENTER_DB_PORT ?? process.env.DB_PORT ?? "3306", 10),
    user: process.env.CENTER_DB_USER ?? process.env.DB_USER,
    password: process.env.CENTER_DB_PASSWORD ?? process.env.DB_PASSWORD,
    database: process.env.CENTER_DB_NAME ?? process.env.DB_NAME,
  };
}

function ensureBusinessPool(): mysql.Pool {
  if (businessPool) {
    return businessPool;
  }

  const dbConfig = getBusinessDBConfig();
  businessPool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  return businessPool;
}

function ensureIdentityPool(): mysql.Pool {
  if (identityPool) {
    return identityPool;
  }

  const dbConfig = getIdentityDBConfig();
  identityPool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  return identityPool;
}

export function createBusinessDb<TSchema extends Record<string, unknown>>(dbSchema: TSchema): MySql2Database<TSchema> {
  return drizzle(ensureBusinessPool(), {
    schema: dbSchema,
    mode: "default",
  });
}

export function createIdentityDb<TSchema extends Record<string, unknown>>(dbSchema: TSchema): MySql2Database<TSchema> {
  return drizzle(ensureIdentityPool(), {
    schema: dbSchema,
    mode: "default",
  });
}

const agentDb = createBusinessDb(agentSchema)
setupDomainAgent({ db: agentDb as unknown as AgentDB })

const identityDb = createIdentityDb(identitySchema)
setupDomainIdentity({ db: identityDb as unknown as IdentityDB })

const cmsDb = createBusinessDb(cmsSchema)
setupDomainCms({ db: cmsDb as unknown as CmsDB })

const crmDb = createBusinessDb(crmSchema)
setupDomainCrm({ db: crmDb as unknown as CrmDB })

const pointDb = createBusinessDb(pointSchema)
setupDomainPoint({ db: pointDb as unknown as PointDB })

const performanceDb = createBusinessDb(performanceSchema)
setupDomainPerformance({ db: performanceDb as unknown as PerformanceDB })

const server = Bun.serve({
  port: config.server.port,
  hostname: config.server.hostname,

  routes: {
    "/rpc": {
      POST: handleRPC(registry, { createContext }),
    },
    "/invite-rpc": {
      POST: handleRPC(inviteRegistry, { createContext: createPublicContext }),
    },
  },
});

console.log(
  `🚀 API Server running at http://${server.hostname}:${server.port}`
);
console.log(`📡 RPC endpoint: POST /rpc`);
