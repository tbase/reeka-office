export interface User {
  id: number
  openid: string
  nickname: string | null
  avatar: string | null
  role: 'agent' | 'admin'
  agentId: number | null
  tenantId: number | null
  agentCode: string | null
  agentName: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface Agent {
  id: number
  tenantId: number
  agentCode: string | null
  name: string
  joinDate: string | null
  designation: number | null
  designationName: string | null
  finacingScheme: string[] | null
  leaderCode: string | null
  lastPromotionDate: string | null
  agency: string | null
  division: string | null
  branch: string | null
  unit: string | null
}

export interface Tenant {
  id: number
  name: string
  status: 'active' | 'inactive'
  createdAt: Date | null
  updatedAt: Date | null
}
