import type { ApmYearlyStatItem } from '../domain/readModels'
import type { PerformanceReadRepository } from '../domain/repositories'
import { createDefaultPerformanceRuntime } from '../infra/defaultDeps'

export interface ListApmYearlyStatsInput {
  year: number
}

export class ListApmYearlyStatsQuery {
  private readonly input: ListApmYearlyStatsInput
  private readonly performanceReadRepository: PerformanceReadRepository

  constructor(
    input: ListApmYearlyStatsInput,
    repository = createDefaultPerformanceRuntime().performanceReadRepository,
  ) {
    this.input = input
    this.performanceReadRepository = repository
  }

  async query(): Promise<ApmYearlyStatItem[]> {
    return this.performanceReadRepository.listApmYearlyStats(this.input.year)
  }
}
