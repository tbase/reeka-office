import { getDb } from '../context'
import type { AgentRecord } from '../domain/readModels'
import { DrizzleAgentReadRepository } from '../infra'

export interface GetAgentInput {
  agentId: number
}

export type GetAgentResult = AgentRecord | null

export class GetAgentQuery {
  private readonly repository: DrizzleAgentReadRepository
  private readonly input: GetAgentInput

  constructor(input: GetAgentInput) {
    this.repository = new DrizzleAgentReadRepository(getDb())
    this.input = input
  }

  async query(): Promise<GetAgentResult> {
    return this.repository.getAgent(this.input.agentId)
  }
}
