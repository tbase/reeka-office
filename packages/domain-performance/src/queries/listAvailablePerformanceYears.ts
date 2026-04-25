import type { PerformanceReadRepository } from '../domain/repositories'
import { createPerformanceReaderRuntime } from '../infra/defaultDeps'

export interface ListAvailablePerformanceYearsInput {
  agentCode: string
}

export class ListAvailablePerformanceYearsQuery {
  private readonly input: ListAvailablePerformanceYearsInput
  private readonly performanceReadRepository: PerformanceReadRepository

  constructor(
    input: ListAvailablePerformanceYearsInput,
    repository = createPerformanceReaderRuntime().performanceReadRepository,
  ) {
    this.input = input
    this.performanceReadRepository = repository
  }

  async query(): Promise<number[]> {
    return this.performanceReadRepository.listAvailableYears(this.input.agentCode)
  }
}
