import type { CurrentPerformanceMetricItem } from '../domain/readModels'
import type { Period } from '../domain/period'
import type { PerformanceReadRepository } from '../domain/repositories'
import { createDefaultPerformanceRuntime } from '../infra/defaultDeps'

export interface GetCurrentPerformanceMetricsInput {
  agentCodes: string[]
  period?: Period | null
}

export class GetCurrentPerformanceMetricsQuery {
  private readonly input: GetCurrentPerformanceMetricsInput
  private readonly performanceReadRepository: PerformanceReadRepository

  constructor(
    input: GetCurrentPerformanceMetricsInput,
    repository = createDefaultPerformanceRuntime().performanceReadRepository,
  ) {
    this.input = input
    this.performanceReadRepository = repository
  }

  async query(): Promise<CurrentPerformanceMetricItem[]> {
    return this.performanceReadRepository.listCurrentMetrics(
      this.input.agentCodes,
      this.input.period ?? null,
    )
  }
}
