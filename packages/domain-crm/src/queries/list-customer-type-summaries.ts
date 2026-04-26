import { createDefaultCrmRuntime } from '../infra'
import type { CrmReadRepository } from '../domain/repositories'
import type { CustomerTypeSummary } from '../domain/readModels'

export class ListCustomerTypeSummariesQuery {
  private readonly readRepository: CrmReadRepository

  constructor(readRepository = createDefaultCrmRuntime().readRepository) {
    this.readRepository = readRepository
  }

  async query(): Promise<CustomerTypeSummary[]> {
    return this.readRepository.listCustomerTypeSummaries()
  }
}
