import type { CrmReadRepository } from '../domain/repositories'
import type { CustomerTypeConfig } from '../domain/readModels'
import { createDefaultCrmRuntime } from '../infra'

export class ListEnabledCustomerTypeConfigsQuery {
  private readonly readRepository: CrmReadRepository

  constructor(readRepository = createDefaultCrmRuntime().readRepository) {
    this.readRepository = readRepository
  }

  async query(): Promise<CustomerTypeConfig[]> {
    return this.readRepository.listEnabledCustomerTypeConfigs()
  }
}
