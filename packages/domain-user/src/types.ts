export interface User {
  id: number
  openid: string
  nickname: string | null
  avatar: string | null
  role: 'agent' | 'admin'
  agentId: number | null
  agentCode: string | null
  agentName: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface Agent {
  id: number
  agentCode: string | null
  name: string
  joinDate: string | null
  designation: string | null
}
