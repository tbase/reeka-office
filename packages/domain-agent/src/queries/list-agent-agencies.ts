import { getDb } from '../context'
import { DrizzleAgentReadRepository } from '../infra'

export interface ListAgentAgenciesInput {}

export type ListAgentAgenciesResult = string[]

export class ListAgentAgenciesQuery {
  private readonly repository: DrizzleAgentReadRepository

  constructor(_input: ListAgentAgenciesInput = {}) {
    this.repository = new DrizzleAgentReadRepository(getDb())
  }

  async query(): Promise<ListAgentAgenciesResult> {
    return this.repository.listAgencies()
  }
}
