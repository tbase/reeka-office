import { getDb } from '../context'
import { DrizzleAgentReadRepository } from '../infra'

export interface AgentProfile {
  id: number
  agentCode: string
  name: string
  joinDate: string | null
  designation: number | null
  leaderCode: string | null
  division: string | null
}

export interface GetAgentByCodeInput {
  agentCode: string
}

export type GetAgentByCodeResult = AgentProfile | null

export class GetAgentByCodeQuery {
  private readonly repository: DrizzleAgentReadRepository
  private readonly input: GetAgentByCodeInput

  constructor(input: GetAgentByCodeInput) {
    this.repository = new DrizzleAgentReadRepository(getDb())
    this.input = input
  }

  async query(): Promise<GetAgentByCodeResult> {
    return this.repository.getAgentByCode(this.input.agentCode)
  }
}
