import { getDb } from '../context'
import { DrizzleAgentReadRepository } from '../infra'

export interface GetTeamMemberRelationInput {
  leaderCode: string
  agentCode: string
}

export interface GetTeamMemberRelationResult {
  hierarchy: number
}

export class GetTeamMemberRelationQuery {
  private readonly repository: DrizzleAgentReadRepository
  private readonly input: GetTeamMemberRelationInput

  constructor(input: GetTeamMemberRelationInput) {
    this.repository = new DrizzleAgentReadRepository(getDb())
    this.input = input
  }

  async query(): Promise<GetTeamMemberRelationResult | null> {
    return this.repository.getTeamMemberRelation(this.input)
  }
}
