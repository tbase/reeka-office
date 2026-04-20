import type { ApmListItem } from '../domain/readModels'
import type { Period } from '../domain/period'
import type { PerformanceReadRepository } from '../domain/repositories'
import { createDefaultPerformanceRuntime } from '../infra/defaultDeps'

export type ListApmInput = Period

export class ListApmQuery {
  private readonly input: ListApmInput
  private readonly performanceReadRepository: PerformanceReadRepository

  constructor(
    input: ListApmInput,
    repository = createDefaultPerformanceRuntime().performanceReadRepository,
  ) {
    this.input = input
    this.performanceReadRepository = repository
  }

  async query(): Promise<ApmListItem[]> {
    return this.performanceReadRepository.listApm(this.input)
  }
}
