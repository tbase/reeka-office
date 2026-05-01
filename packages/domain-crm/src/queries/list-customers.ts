import { normalizePositiveId, type CustomerSort } from '../domain/customer'
import type { CrmReadRepository } from '../domain/repositories'
import type { CustomerListItem } from '../domain/readModels'
import { createDefaultCrmRuntime } from '../infra'

export interface ListCustomersInput {
  agentId: number
  archived?: boolean
  keyword?: string | null
  customerTypeId?: number | null
  sort?: CustomerSort
}

export class ListCustomersQuery {
  private readonly input: ListCustomersInput
  private readonly readRepository: CrmReadRepository

  constructor(input: ListCustomersInput, readRepository = createDefaultCrmRuntime().readRepository) {
    this.input = input
    this.readRepository = readRepository
  }

  async query(): Promise<CustomerListItem[]> {
    return this.readRepository.listCustomers({
      agentId: normalizePositiveId(this.input.agentId, '代理人 ID 无效'),
      archived: this.input.archived,
      keyword: this.input.keyword,
      customerTypeId: this.input.customerTypeId,
      sort: this.input.sort ?? 'last_followed_desc',
    })
  }
}
