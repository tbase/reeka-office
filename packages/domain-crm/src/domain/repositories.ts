import type { FollowUpMethod, NormalizedCustomerInput } from './customer'
import type { NormalizedCustomerTypeConfig } from './profile'
import type {
  CustomerDetail,
  CustomerListInput,
  CustomerListItem,
  CustomerTypeConfig,
  CustomerTypeSummaryFilters,
  CustomerTypeSummary,
  DuplicateCustomerCandidate,
  PendingAnalysisCustomer,
} from './readModels'

export interface CrmMetadataRepository {
  createCustomerType(config: NormalizedCustomerTypeConfig): Promise<number>
  updateCustomerType(config: NormalizedCustomerTypeConfig & { id: number }): Promise<void>
}

export interface CrmCustomerRepository {
  createCustomer(input: NormalizedCustomerInput): Promise<number>
  updateCustomer(customerId: number, input: NormalizedCustomerInput): Promise<void>
  createFollowUp(input: {
    agentId: number
    customerId: number
    customerTypeId: number
    method: FollowUpMethod | null
    followedAt: Date
    content: string
  }): Promise<number>
  updateFollowUp(input: {
    agentId: number
    customerId: number
    followUpId: number
    method?: FollowUpMethod | null
    followedAt: Date
    content: string
  }): Promise<boolean>
  markFollowUpsAnalyzed(input: {
    customerId: number
    followUpIds: number[]
  }): Promise<void>
}

export interface CrmReadRepository {
  listCustomerTypeSummaries(filters?: CustomerTypeSummaryFilters): Promise<CustomerTypeSummary[]>
  getCustomerTypeConfig(customerTypeId: number): Promise<CustomerTypeConfig | null>
  listCustomers(input: CustomerListInput): Promise<CustomerListItem[]>
  getCustomerDetail(input: { agentId: number; customerId: number }): Promise<CustomerDetail | null>
  getCustomerDetailById(customerId: number): Promise<CustomerDetail | null>
  listPendingAnalysisCustomers(): Promise<PendingAnalysisCustomer[]>
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
