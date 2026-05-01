import type { CrmReadRepository } from '../domain/repositories'
import type { PendingAnalysisCustomer } from '../domain/readModels'
import { createDefaultCrmRuntime } from '../infra'

export class ListPendingAnalysisCustomersQuery {
  private readonly readRepository: CrmReadRepository

  constructor(readRepository = createDefaultCrmRuntime().readRepository) {
    this.readRepository = readRepository
  }

  async query(): Promise<PendingAnalysisCustomer[]> {
    return this.readRepository.listPendingAnalysisCustomers()
  }
}
