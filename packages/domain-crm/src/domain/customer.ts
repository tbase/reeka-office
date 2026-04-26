import { ensureMaxLength, normalizeOptionalText } from '@reeka-office/domain-shared'
import { normalizeRequiredText } from './profile'

export type CustomerSort = 'last_followed_desc' | 'created_desc'
export type CustomerGender = 'M' | 'F'

export interface ProfileValueInput {
  fieldId: number
  value?: string | null
}

export interface CustomerInput {
  agentId: number
  customerTypeId: number
  name: string
  gender?: CustomerGender | null
  phone?: string | null
  wechat?: string | null
  tags?: string[]
  note?: string | null
  profileValues?: ProfileValueInput[]
}

export interface NormalizedProfileValue {
  fieldId: number
  value: string
}

export interface NormalizedCustomerInput {
  agentId: number
  customerTypeId: number
  name: string
  gender: CustomerGender | null
  phone: string | null
  wechat: string | null
  tags: string[]
  note: string | null
  profileValues: NormalizedProfileValue[]
}

export function normalizeCustomerInput(input: CustomerInput): NormalizedCustomerInput {
  const name = normalizeRequiredText(input.name, '客户称呼不能为空')
  ensureMaxLength(name, 100, '客户称呼不能超过 100 个字符')
  const gender = normalizeGender(input.gender)
  const phone = normalizeOptionalText(input.phone)
  const wechat = normalizeOptionalText(input.wechat)
  ensureMaxLength(phone, 50, '手机号不能超过 50 个字符')
  ensureMaxLength(wechat, 100, '微信号不能超过 100 个字符')

  return {
    agentId: normalizePositiveId(input.agentId, '代理人 ID 无效'),
    customerTypeId: normalizePositiveId(input.customerTypeId, '客户类型 ID 无效'),
    name,
    gender,
    phone,
    wechat,
    tags: normalizeTags(input.tags ?? []),
    note: normalizeOptionalText(input.note),
    profileValues: normalizeProfileValues(input.profileValues ?? []),
  }
}

export function normalizeGender(value?: CustomerGender | null): CustomerGender | null {
  if (value == null) {
    return null
  }

  if (value !== 'M' && value !== 'F') {
    throw new Error('客户性别无效')
  }

  return value
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const tag of tags) {
    const text = tag.trim()
    if (!text || seen.has(text)) {
      continue
    }
    ensureMaxLength(text, 30, '标签不能超过 30 个字符')
    seen.add(text)
    normalized.push(text)
  }

  return normalized
}

export function normalizeProfileValues(values: ProfileValueInput[]): NormalizedProfileValue[] {
  const result: NormalizedProfileValue[] = []
  const seen = new Set<number>()

  for (const item of values) {
    const fieldId = normalizePositiveId(item.fieldId, '画像字段 ID 无效')
    const value = normalizeOptionalText(item.value)
    if (!value) {
      continue
    }
    if (seen.has(fieldId)) {
      throw new Error('画像字段重复')
    }

    seen.add(fieldId)
    result.push({ fieldId, value })
  }

  return result
}

export function normalizePositiveId(value: number, message: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(message)
  }

  return value
}

export function parseFollowedAt(value?: Date | string | null): Date {
  if (!value) {
    return new Date()
  }

  const date = value instanceof Date ? value : new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) {
    throw new Error('跟进时间无效')
  }

  return date
}
