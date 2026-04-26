import { normalizePositiveId } from '../domain/customer'
import type { CrmReadRepository } from '../domain/repositories'
import type { CustomerDetail } from '../domain/readModels'
import { createDefaultCrmRuntime } from '../infra'

export interface GetCustomerDetailInput {
  agentId: number
  customerId: number
}

export class GetCustomerDetailQuery {
  private readonly input: GetCustomerDetailInput
  private readonly readRepository: CrmReadRepository

  constructor(input: GetCustomerDetailInput, readRepository = createDefaultCrmRuntime().readRepository) {
    this.input = input
    this.readRepository = readRepository
  }

  async query(): Promise<CustomerDetail | null> {
    return this.readRepository.getCustomerDetail({
      agentId: normalizePositiveId(this.input.agentId, '代理人 ID 无效'),
      customerId: normalizePositiveId(this.input.customerId, '客户 ID 无效'),
    })
  }
}
