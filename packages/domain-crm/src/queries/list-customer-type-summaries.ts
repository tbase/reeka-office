import { createDefaultCrmRuntime } from '../infra'
import type { CrmReadRepository } from '../domain/repositories'
import type { CustomerTypeSummary, CustomerTypeSummaryFilters } from '../domain/readModels'

export class ListCustomerTypeSummariesQuery {
  private readonly filters: CustomerTypeSummaryFilters
  private readonly readRepository: CrmReadRepository

  constructor(
    filters: CustomerTypeSummaryFilters = {},
    readRepository = createDefaultCrmRuntime().readRepository,
  ) {
    this.filters = filters
    this.readRepository = readRepository
  }

  async query(): Promise<CustomerTypeSummary[]> {
    return this.readRepository.listCustomerTypeSummaries(this.filters)
  }
}
