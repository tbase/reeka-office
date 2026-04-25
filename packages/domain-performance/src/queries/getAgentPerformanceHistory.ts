import type { PerformanceHistoryItem } from '../domain/readModels'
import type { PerformanceReadRepository } from '../domain/repositories'
import { createPerformanceReaderRuntime } from '../infra/defaultDeps'

export interface GetAgentPerformanceHistoryInput {
  agentCode: string
  year: number
}

export class GetAgentPerformanceHistoryQuery {
  private readonly input: GetAgentPerformanceHistoryInput
  private readonly performanceReadRepository: PerformanceReadRepository

  constructor(
    input: GetAgentPerformanceHistoryInput,
    repository = createPerformanceReaderRuntime().performanceReadRepository,
  ) {
    this.input = input
    this.performanceReadRepository = repository
  }

  async query(): Promise<PerformanceHistoryItem[]> {
    return this.performanceReadRepository.getAgentHistory(this.input.agentCode, this.input.year)
  }
}
