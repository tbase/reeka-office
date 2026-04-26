import { normalizePositiveId } from '../domain/customer'
import type { CrmReadRepository } from '../domain/repositories'
import type { DuplicateCustomerCandidate } from '../domain/readModels'
import { createDefaultCrmRuntime } from '../infra'

export interface CheckDuplicateCustomersInput {
  agentId: number
  customerTypeId: number
  phone?: string | null
  wechat?: string | null
  excludeCustomerId?: number | null
}

export class CheckDuplicateCustomersQuery {
  private readonly input: CheckDuplicateCustomersInput
  private readonly readRepository: CrmReadRepository

  constructor(input: CheckDuplicateCustomersInput, readRepository = createDefaultCrmRuntime().readRepository) {
    this.input = input
    this.readRepository = readRepository
  }

  async query(): Promise<DuplicateCustomerCandidate[]> {
    return this.readRepository.findDuplicateCustomers({
      agentId: normalizePositiveId(this.input.agentId, '代理人 ID 无效'),
      customerTypeId: normalizePositiveId(this.input.customerTypeId, '客户类型 ID 无效'),
      phone: this.input.phone?.trim() || null,
      wechat: this.input.wechat?.trim() || null,
      excludeCustomerId: this.input.excludeCustomerId,
    })
  }
}
