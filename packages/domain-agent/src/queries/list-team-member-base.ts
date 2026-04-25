import { getDb } from '../context'
import { DrizzleAgentReadRepository } from '../infra'

export type TeamScope = 'direct' | 'division' | 'all'

export interface TeamMemberBaseItem {
  agentCode: string
  name: string
  designation: number | null
  leaderCode: string | null
  hierarchy: number
}

interface ListHierarchyTeamMemberBaseInput {
  leaderCode: string
  scope: 'direct' | 'all'
}

interface ListDivisionTeamMemberBaseInput {
  agentCode: string
  division: string
  scope: 'division'
}

export type ListTeamMemberBaseInput =
  | ListHierarchyTeamMemberBaseInput
  | ListDivisionTeamMemberBaseInput

export type ListTeamMemberBaseResult = TeamMemberBaseItem[]

export class ListTeamMemberBaseQuery {
  private readonly repository: DrizzleAgentReadRepository
  private readonly input: ListTeamMemberBaseInput

  constructor(input: ListTeamMemberBaseInput) {
    this.repository = new DrizzleAgentReadRepository(getDb())
    this.input = input
  }

  async query(): Promise<ListTeamMemberBaseResult> {
    return this.repository.listTeamMemberBase(this.input)
  }
}
