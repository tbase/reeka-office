import type { CustomerGender, CustomerSort, FollowUpAnalysisStatus, FollowUpMethod } from './customer'

export interface CustomerTypeSummary {
  id: number
  name: string
  description: string | null
  enabled: boolean
  supportsOpportunity: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface CustomerTypeSummaryFilters {
  enabled?: boolean
}

export interface ProfileFieldConfig {
  id: number
  customerTypeId: number
  name: string
  description: string | null
  enabled: boolean
  sortOrder: number
}

export interface CustomerTypeConfig {
  id: number
  name: string
  description: string | null
  enabled: boolean
  supportsOpportunity: boolean
  sortOrder: number
  profileFields: ProfileFieldConfig[]
  createdAt: Date
  updatedAt: Date
}

export interface CustomerListInput {
  agentId: number
  archived?: boolean
  keyword?: string | null
  customerTypeId?: number | null
  sort?: CustomerSort
}

export interface CustomerListItem {
  id: number
  customerTypeId: number
  customerTypeName: string
  name: string
  gender: CustomerGender | null
  birthday: string | null
  city: string | null
  phone: string | null
  wechat: string | null
  tags: string[]
  lastFollowedAt: Date | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CustomerProfileValueDetail {
  fieldId: number
  customerTypeId: number
  fieldName: string | null
  fieldDescription: string | null
  fieldEnabled: boolean
  sortOrder: number
  value: string
}

export interface FollowUpRecordDetail {
  id: number
  customerTypeId: number
  method: FollowUpMethod | null
  followedAt: Date
  content: string
  analysisStatus: FollowUpAnalysisStatus
  createdAt: Date
}

export interface CustomerDetail {
  id: number
  agentId: number
  customerTypeId: number
  customerTypeName: string
  name: string
  gender: CustomerGender | null
  birthday: string | null
  city: string | null
  phone: string | null
  wechat: string | null
  tags: string[]
  note: string | null
  archivedAt: Date | null
  lastFollowedAt: Date | null
  createdAt: Date
  updatedAt: Date
  currentProfileValues: CustomerProfileValueDetail[]
  allProfileValues: CustomerProfileValueDetail[]
  followUps: FollowUpRecordDetail[]
}

export interface PendingAnalysisCustomer {
  customerId: number
  name: string
}

export interface DuplicateCustomerCandidate {
  id: number
  name: string
  phone: string | null
  wechat: string | null
  archivedAt: Date | null
}
