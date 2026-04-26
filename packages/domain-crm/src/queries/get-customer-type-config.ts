import { normalizePositiveId } from '../domain/customer'
import type { CrmReadRepository } from '../domain/repositories'
import type { CustomerTypeConfig } from '../domain/readModels'
import { createDefaultCrmRuntime } from '../infra'

export interface GetCustomerTypeConfigInput {
  customerTypeId: number
}

export class GetCustomerTypeConfigQuery {
  private readonly input: GetCustomerTypeConfigInput
  private readonly readRepository: CrmReadRepository

  constructor(input: GetCustomerTypeConfigInput, readRepository = createDefaultCrmRuntime().readRepository) {
    this.input = input
    this.readRepository = readRepository
  }

  async query(): Promise<CustomerTypeConfig | null> {
    return this.readRepository.getCustomerTypeConfig(
      normalizePositiveId(this.input.customerTypeId, '客户类型 ID 无效'),
    )
  }
}
