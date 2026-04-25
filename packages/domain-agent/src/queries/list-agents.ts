import { getDb } from '../context'
import type { AgentRecord } from '../domain/readModels'
import { DrizzleAgentReadRepository } from '../infra'

export const LIST_AGENT_SORTS = [
  'designation_asc',
  'designation_desc',
  'join_date_asc',
  'join_date_desc',
] as const

export type ListAgentSort = (typeof LIST_AGENT_SORTS)[number]

export interface ListAgentsInput {
  agency?: string | null
  division?: string | null
  sort?: ListAgentSort
  agentId?: number
  keyword?: string | null
  limit?: number
}

export type ListAgentsResult = AgentRecord[]

export class ListAgentsQuery {
  private readonly repository: DrizzleAgentReadRepository
  private readonly input: ListAgentsInput

  constructor(input: ListAgentsInput) {
    this.input = input
    this.repository = new DrizzleAgentReadRepository(getDb())
  }

  async query(): Promise<ListAgentsResult> {
    return this.repository.listAgents(this.input)
  }
}
