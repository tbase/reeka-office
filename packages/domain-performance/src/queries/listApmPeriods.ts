import type { Period } from '../domain/period'
import type { PerformanceReadRepository } from '../domain/repositories'
import { createDefaultPerformanceRuntime } from '../infra/defaultDeps'

export interface ListApmPeriodsInput {
  limit?: number
}

export class ListApmPeriodsQuery {
  private readonly input: ListApmPeriodsInput
  private readonly performanceReadRepository: PerformanceReadRepository

  constructor(
    input: ListApmPeriodsInput = {},
    repository = createDefaultPerformanceRuntime().performanceReadRepository,
  ) {
    this.input = input
    this.performanceReadRepository = repository
  }

  async query(): Promise<Period[]> {
    return this.performanceReadRepository.listPeriods(this.input)
  }
}
