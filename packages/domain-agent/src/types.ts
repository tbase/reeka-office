export interface Agent {
  id: number
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
