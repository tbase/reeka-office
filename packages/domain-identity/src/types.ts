export interface IdentityUser {
  id: number
  openid: string
  nickname: string | null
  avatar: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface UserTenant {
  tenantCode: string
  tenantName: string
  adminDomain: string
  apiServiceName: string
  agentId: number
  boundAt: Date | null
}

export interface ResolvedTenantAgent {
  userId: number
  openid: string
  nickname: string | null
  avatar: string | null
  createdAt: Date | null
  updatedAt: Date | null
  tenantCode: string
  agentId: number
}

export interface BindingTokenInfo {
  token: string
  tenantCode: string
  agentId: number
  expiresAt: Date
  boundAt: Date | null
  boundUserId: number | null
}

export interface InviteShareTokenInfo {
  token: string
  tenantCode: string
  tenantName: string
  apiServiceName: string
  inviterAgentId: number
  inviterAgentCode: string
  expiresAt: Date
  isExpired: boolean
}
