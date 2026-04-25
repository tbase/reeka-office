import { getDb } from '../context'
import { DrizzleAgentReadRepository } from '../infra'

export interface AgentPromotionProfile {
  agentCode: string
  designation: number | null
  joinDate: string | null
  lastPromotionDate: string | null
}

export interface GetAgentPromotionProfileInput {
  agentCode: string
}

export type GetAgentPromotionProfileResult = AgentPromotionProfile | null

export class GetAgentPromotionProfileQuery {
  private readonly repository: DrizzleAgentReadRepository
  private readonly input: GetAgentPromotionProfileInput

  constructor(input: GetAgentPromotionProfileInput) {
    this.repository = new DrizzleAgentReadRepository(getDb())
    this.input = input
  }

  async query(): Promise<GetAgentPromotionProfileResult> {
    return this.repository.getPromotionProfile(this.input.agentCode)
  }
}
