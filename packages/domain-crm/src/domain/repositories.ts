import type { NormalizedCustomerInput } from './customer'
import type { NormalizedCustomerTypeConfig } from './profile'
import type {
  CustomerDetail,
  CustomerListInput,
  CustomerListItem,
  CustomerTypeConfig,
  CustomerTypeSummaryFilters,
  CustomerTypeSummary,
  DuplicateCustomerCandidate,
} from './readModels'

export interface CrmMetadataRepository {
  createCustomerType(config: NormalizedCustomerTypeConfig): Promise<number>
  updateCustomerType(config: NormalizedCustomerTypeConfig & { id: number }): Promise<void>
}

export interface CrmCustomerRepository {
  createCustomer(input: NormalizedCustomerInput): Promise<number>
  updateCustomer(customerId: number, input: NormalizedCustomerInput): Promise<void>
  archiveCustomer(input: { agentId: number; customerId: number; archivedAt: Date }): Promise<boolean>
  createFollowUp(input: {
    agentId: number
    customerId: number
    customerTypeId: number
    statusId: number
    statusNameSnapshot: string
    followedAt: Date
    content: string
  }): Promise<number>
  updateFollowUp(input: {
    agentId: number
    customerId: number
    followUpId: number
    statusId: number
    statusNameSnapshot: string
    followedAt: Date
    content: string
  }): Promise<boolean>
}

export interface CrmReadRepository {
  listCustomerTypeSummaries(filters?: CustomerTypeSummaryFilters): Promise<CustomerTypeSummary[]>
  getCustomerTypeConfig(customerTypeId: number): Promise<CustomerTypeConfig | null>
  listCustomers(input: CustomerListInput): Promise<CustomerListItem[]>
  getCustomerDetail(input: { agentId: number; customerId: number }): Promise<CustomerDetail | null>
  findDuplicateCustomers(input: {
    agentId: number
    customerTypeId: number
    phone?: string | null
    wechat?: string | null
    excludeCustomerId?: number | null
  }): Promise<DuplicateCustomerCandidate[]>
  getOwnedCustomer(input: { agentId: number; customerId: number }): Promise<{
    id: number
    agentId: number
    customerTypeId: number
    lastFollowedAt: Date | null
  } | null>
}
