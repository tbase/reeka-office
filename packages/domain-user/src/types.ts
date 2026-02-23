export interface User {
  id: number
  openid: string
  nickname: string | null
  avatar: string | null
  role: 'agent' | 'admin'
  agentCode: string | null
  agentName: string | null
  createdAt: Date | null
  updatedAt: Date | null
}