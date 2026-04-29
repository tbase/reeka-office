import { and, desc, eq, gt } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { inviteShareTokens, tenants } from '../db/schema'

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
const TOKEN_RANDOM_LENGTH = 32
const DEFAULT_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000

export interface CreateInviteShareTokenInput {
  tenantCode: string
  inviterAgentId: number
  inviterAgentCode: string
  expiresAt?: Date
}

export interface CreateInviteShareTokenResult {
  token: string
  tenantCode: string
  tenantName: string
  apiServiceName: string
  inviterAgentId: number
  inviterAgentCode: string
  expiresAt: Date
}

function generateRandomToken(length = TOKEN_RANDOM_LENGTH): string {
  let token = ''

  for (let index = 0; index < length; index += 1) {
    token += TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)]
  }

  return token
}

function normalizeTenantCode(value: string): string {
  const tenantCode = value.trim()
  if (!tenantCode) {
    throw new Error('租户不能为空')
  }
  return tenantCode
}

function normalizeAgentCode(value: string): string {
  const agentCode = value.trim().toUpperCase()
  if (!agentCode) {
    throw new Error('邀请人代理人编码不能为空')
  }
  return agentCode
}

export class CreateInviteShareTokenCommand {
  private readonly db: DB
  private readonly input: CreateInviteShareTokenInput

  constructor(input: CreateInviteShareTokenInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<CreateInviteShareTokenResult> {
    const tenantCode = normalizeTenantCode(this.input.tenantCode)
    const inviterAgentCode = normalizeAgentCode(this.input.inviterAgentCode)
    const expiresAt = this.input.expiresAt ?? new Date(Date.now() + DEFAULT_EXPIRES_IN_MS)

    if (!Number.isInteger(this.input.inviterAgentId) || this.input.inviterAgentId <= 0) {
      throw new Error('邀请人代理人身份无效')
    }

    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
      throw new Error('邀请链接过期时间无效')
    }

    if (expiresAt.getTime() <= Date.now()) {
      throw new Error('邀请链接过期时间必须晚于当前时间')
    }

    return this.db.transaction(async (tx) => {
      const tenantRows = await tx
        .select({
          tenantCode: tenants.tenantCode,
          tenantName: tenants.tenantName,
          apiServiceName: tenants.apiServiceName,
          status: tenants.status,
        })
        .from(tenants)
        .where(eq(tenants.tenantCode, tenantCode))
        .limit(1)

      const tenant = tenantRows[0]
      if (!tenant || tenant.status !== 'active') {
        throw new Error('租户不存在或已停用')
      }

      const activeTokenRows = await tx
        .select({
          token: inviteShareTokens.token,
          expiresAt: inviteShareTokens.expiresAt,
        })
        .from(inviteShareTokens)
        .where(and(
          eq(inviteShareTokens.tenantCode, tenantCode),
          eq(inviteShareTokens.inviterAgentId, this.input.inviterAgentId),
          gt(inviteShareTokens.expiresAt, new Date()),
        ))
        .orderBy(desc(inviteShareTokens.expiresAt))
        .limit(1)

      const activeToken = activeTokenRows[0]
      if (activeToken) {
        return {
          token: activeToken.token,
          tenantCode,
          tenantName: tenant.tenantName,
          apiServiceName: tenant.apiServiceName,
          inviterAgentId: this.input.inviterAgentId,
          inviterAgentCode,
          expiresAt: activeToken.expiresAt,
        }
      }

      let token = ''

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = generateRandomToken()
        const existingTokenRows = await tx
          .select({ token: inviteShareTokens.token })
          .from(inviteShareTokens)
          .where(eq(inviteShareTokens.token, candidate))
          .limit(1)

        if (!existingTokenRows[0]) {
          token = candidate
          break
        }
      }

      if (!token) {
        throw new Error('生成邀请链接失败，请重试')
      }

      await tx.insert(inviteShareTokens).values({
        token,
        tenantCode,
        inviterAgentId: this.input.inviterAgentId,
        inviterAgentCode,
        expiresAt,
      })

      return {
        token,
        tenantCode,
        tenantName: tenant.tenantName,
        apiServiceName: tenant.apiServiceName,
        inviterAgentId: this.input.inviterAgentId,
        inviterAgentCode,
        expiresAt,
      }
    })
  }
}
