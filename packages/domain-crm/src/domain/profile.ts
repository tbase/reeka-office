import { ensureMaxLength, normalizeOptionalText } from '@reeka-office/domain-shared'

export interface ProfileFieldInput {
  id?: number | null
  name: string
  description?: string | null
  enabled?: boolean
  sortOrder?: number
}

export interface CustomerTagInput {
  id?: number | null
  name: string
  enabled?: boolean
  sortOrder?: number
}

export interface CustomerTypeConfigInput {
  id?: number | null
  name: string
  description?: string | null
  enabled?: boolean
  supportsOpportunity?: boolean
  sortOrder?: number
  profileFields?: ProfileFieldInput[]
  tags?: CustomerTagInput[]
}

export interface NormalizedProfileField {
  id: number | null
  name: string
  description: string | null
  enabled: boolean
  sortOrder: number
}

export interface NormalizedCustomerTag {
  id: number | null
  name: string
  enabled: boolean
  sortOrder: number
}

export interface NormalizedCustomerTypeConfig {
  id: number | null
  name: string
  description: string | null
  enabled: boolean
  supportsOpportunity: boolean
  sortOrder: number
  profileFields: NormalizedProfileField[]
  tags: NormalizedCustomerTag[]
}

export function normalizeCustomerTypeConfig(input: CustomerTypeConfigInput): NormalizedCustomerTypeConfig {
  const name = normalizeRequiredText(input.name, '客户类型名称不能为空')
  ensureMaxLength(name, 100, '客户类型名称不能超过 100 个字符')
  const profileFields = (input.profileFields ?? []).map((field, index) => normalizeProfileField(field, index))
  const tags = (input.tags ?? []).map((tag, index) => normalizeCustomerTag(tag, index))
  ensureUniqueProfileFieldNames(profileFields)
  ensureUniqueCustomerTagNames(tags)

  return {
    id: normalizeId(input.id),
    name,
    description: normalizeOptionalText(input.description),
    enabled: input.enabled ?? true,
    supportsOpportunity: input.supportsOpportunity ?? false,
    sortOrder: normalizeSortOrder(input.sortOrder),
    profileFields,
    tags,
  }
}

export function normalizeProfileField(input: ProfileFieldInput, index = 0): NormalizedProfileField {
  const name = normalizeRequiredText(input.name, '画像字段名称不能为空')
  ensureMaxLength(name, 100, '画像字段名称不能超过 100 个字符')

  return {
    id: normalizeId(input.id),
    name,
    description: normalizeOptionalText(input.description),
    enabled: input.enabled ?? true,
    sortOrder: normalizeSortOrder(input.sortOrder ?? index),
  }
}

export function normalizeCustomerTag(input: CustomerTagInput, index = 0): NormalizedCustomerTag {
  const name = normalizeRequiredText(input.name, '客户标签不能为空')
  ensureMaxLength(name, 30, '客户标签不能超过 30 个字符')

  return {
    id: normalizeId(input.id),
    name,
    enabled: input.enabled ?? true,
    sortOrder: normalizeSortOrder(input.sortOrder ?? index),
  }
}

export function normalizeRequiredText(value: string | null | undefined, message: string): string {
  const text = value?.trim()
  if (!text) {
    throw new Error(message)
  }

  return text
}

export function normalizeSortOrder(value: number | null | undefined): number {
  if (value == null) {
    return 0
  }

  if (!Number.isInteger(value)) {
    throw new Error('排序必须为整数')
  }

  return value
}

export function normalizeId(value: number | null | undefined): number | null {
  if (value == null) {
    return null
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('ID 无效')
  }

  return value
}

function ensureUniqueProfileFieldNames(fields: NormalizedProfileField[]): void {
  const seen = new Set<string>()

  for (const field of fields) {
    if (seen.has(field.name)) {
      throw new Error('画像字段名称不能重复')
    }

    seen.add(field.name)
  }
}

function ensureUniqueCustomerTagNames(tags: NormalizedCustomerTag[]): void {
  const seen = new Set<string>()

  for (const tag of tags) {
    if (seen.has(tag.name)) {
      throw new Error('客户标签不能重复')
    }

    seen.add(tag.name)
  }
}
