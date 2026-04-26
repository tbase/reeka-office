import type { NormalizedCustomerInput } from './customer'
import type { NormalizedCustomerTypeConfig, NormalizedProfileField } from './profile'
import type {
  CustomerDetail,
  CustomerListInput,
  CustomerListItem,
  CustomerTypeConfig,
  CustomerTypeSummary,
  DuplicateCustomerCandidate,
  FollowUpStatusConfig,
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
  listCustomerTypeSummaries(): Promise<CustomerTypeSummary[]>
  getCustomerTypeConfig(customerTypeId: number): Promise<CustomerTypeConfig | null>
  listEnabledCustomerTypeConfigs(): Promise<CustomerTypeConfig[]>
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
  getEnabledCustomerType(customerTypeId: number): Promise<CustomerTypeConfig | null>
  getEnabledFollowUpStatus(input: { customerTypeId: number; statusId: number }): Promise<FollowUpStatusConfig | null>
  listEnabledProfileFields(customerTypeId: number): Promise<NormalizedProfileField[]>
}
