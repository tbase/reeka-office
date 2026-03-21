import { and, eq, isNull } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { bindingTokens, tenants, userTenantBindings } from '../db/schema'

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export interface CreateBindingTokenInput {
  tenantCode: string
  agentId: number
  expiresAt?: Date
}

export interface CreateBindingTokenResult {
  token: string
  tenantCode: string
  agentId: number
  expiresAt: Date
}

function generateToken(length = 8): string {
  let token = ''

  for (let index = 0; index < length; index += 1) {
    token += TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)]
  }

  return token
}

export class CreateBindingTokenCommand {
  private readonly db: DB
  private readonly input: CreateBindingTokenInput

  constructor(input: CreateBindingTokenInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<CreateBindingTokenResult> {
    const expiresAt = this.input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000)

    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
      throw new Error('绑定码过期时间无效')
    }

    if (expiresAt.getTime() <= Date.now()) {
      throw new Error('绑定码过期时间必须晚于当前时间')
    }

    return this.db.transaction(async (tx) => {
      const tenantRows = await tx
        .select({
          tenantCode: tenants.tenantCode,
          status: tenants.status,
        })
        .from(tenants)
        .where(eq(tenants.tenantCode, this.input.tenantCode))
        .limit(1)

      const tenant = tenantRows[0]
      if (!tenant || tenant.status !== 'active') {
        throw new Error('租户不存在或已停用')
      }

      const activeBindingRows = await tx
        .select({ id: userTenantBindings.id })
        .from(userTenantBindings)
        .where(and(
          eq(userTenantBindings.tenantCode, this.input.tenantCode),
          eq(userTenantBindings.agentId, this.input.agentId),
          isNull(userTenantBindings.unboundAt),
        ))
        .limit(1)

      if (activeBindingRows[0]) {
        throw new Error('该代理人已绑定用户')
      }

      let token = ''

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = generateToken()

        const existingTokenRows = await tx
          .select({ token: bindingTokens.token })
          .from(bindingTokens)
          .where(eq(bindingTokens.token, candidate))
          .limit(1)

        if (!existingTokenRows[0]) {
          token = candidate
          break
        }
      }

      if (!token) {
        throw new Error('生成绑定码失败，请重试')
      }

      await tx.insert(bindingTokens).values({
        token,
        tenantCode: this.input.tenantCode,
        agentId: this.input.agentId,
        expiresAt,
      })

      return {
        token,
        tenantCode: this.input.tenantCode,
        agentId: this.input.agentId,
        expiresAt,
      }
    })
  }
}
