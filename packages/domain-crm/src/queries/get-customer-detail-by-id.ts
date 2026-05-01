import { normalizePositiveId } from '../domain/customer'
import type { CrmReadRepository } from '../domain/repositories'
import type { CustomerDetail } from '../domain/readModels'
import { createDefaultCrmRuntime } from '../infra'

export interface GetCustomerDetailByIdInput {
  customerId: number
}

export class GetCustomerDetailByIdQuery {
  private readonly input: GetCustomerDetailByIdInput
  private readonly readRepository: CrmReadRepository

  constructor(input: GetCustomerDetailByIdInput, readRepository = createDefaultCrmRuntime().readRepository) {
    this.input = input
    this.readRepository = readRepository
  }

  async query(): Promise<CustomerDetail | null> {
    return this.readRepository.getCustomerDetailById(
      normalizePositiveId(this.input.customerId, '客户 ID 无效'),
    )
  }
}
