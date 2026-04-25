import type { MonthlyMetricValueItem, PerformanceMetricName } from '../domain/readModels'
import type { PerformanceReadRepository } from '../domain/repositories'
import { createPerformanceReaderRuntime } from '../infra/defaultDeps'

export interface GetMonthlyMetricValuesInput {
  agentCodes: string[]
  year: number
  metricName: PerformanceMetricName
}

export class GetMonthlyMetricValuesQuery {
  private readonly input: GetMonthlyMetricValuesInput
  private readonly performanceReadRepository: PerformanceReadRepository

  constructor(
    input: GetMonthlyMetricValuesInput,
    repository = createPerformanceReaderRuntime().performanceReadRepository,
  ) {
    this.input = input
    this.performanceReadRepository = repository
  }

  async query(): Promise<MonthlyMetricValueItem[]> {
    return this.performanceReadRepository.listMonthlyMetricValues(
      this.input.agentCodes,
      this.input.year,
      this.input.metricName,
    )
  }
}
