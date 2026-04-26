import type { CustomerGender, CustomerSort } from './customer'

export interface CustomerTypeSummary {
  id: number
  name: string
  description: string | null
  enabled: boolean
  supportsOpportunity: boolean
  sortOrder: number
  profileFieldCount: number
  followUpStatusCount: number
  createdAt: Date
  updatedAt: Date
}

export interface ProfileFieldConfig {
  id: number
  customerTypeId: number
  name: string
  description: string | null
  enabled: boolean
  sortOrder: number
}

export interface FollowUpStatusConfig {
  id: number
  customerTypeId: number
  name: string
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
  followUpStatuses: FollowUpStatusConfig[]
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
  statusId: number
  statusNameSnapshot: string
  followedAt: Date
  content: string
  createdAt: Date
}

export interface CustomerDetail {
  id: number
  agentId: number
  customerTypeId: number
  customerTypeName: string
  name: string
  gender: CustomerGender | null
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

export interface DuplicateCustomerCandidate {
  id: number
  name: string
  phone: string | null
  wechat: string | null
  archivedAt: Date | null
}
