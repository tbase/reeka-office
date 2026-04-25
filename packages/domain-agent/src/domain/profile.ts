import {
  ensureDateString,
  ensureMaxLength,
  normalizeOptionalText,
} from '@reeka-office/domain-shared'

import { normalizeAgentCode } from './agentCode'
import type { AgentEventValue, AgentProfileChange } from './events'

export interface AgentProfileState {
  agentCode: string
  name: string
  joinDate: string | null
  designation: number | null
  finacingScheme: string[] | null
  leaderCode: string | null
  lastPromotionDate: string | null
  agency: string | null
  division: string | null
  branch: string | null
  unit: string | null
}

export interface AgentProfileInput {
  agentCode: string
  name: string
  joinDate: string | null
  designation?: number | null
  finacingScheme?: string[] | null
  leaderCode?: string | null
  lastPromotionDate?: string | null
  agency?: string | null
  division?: string | null
  branch?: string | null
  unit?: string | null
}

export const AGENT_PROFILE_FIELDS = [
  'name',
  'joinDate',
  'designation',
  'finacingScheme',
  'leaderCode',
  'lastPromotionDate',
  'agency',
  'division',
  'branch',
  'unit',
] as const satisfies ReadonlyArray<keyof AgentProfileState>

export function normalizeAgentProfile(input: AgentProfileInput): AgentProfileState {
  const agentCode = normalizeAgentCode(input.agentCode)
  const name = input.name.trim()
  const joinDate = normalizeOptionalText(input.joinDate)
  const designation = normalizeNullableInt(input.designation)
  const finacingScheme = normalizeStringArray(input.finacingScheme)
  const leaderCode = normalizeOptionalText(input.leaderCode)
  const lastPromotionDate = normalizeOptionalText(input.lastPromotionDate)
  const agency = normalizeOptionalText(input.agency)
  const division = normalizeOptionalText(input.division)
  const branch = normalizeOptionalText(input.branch)
  const unit = normalizeOptionalText(input.unit)

  if (!name) {
    throw new Error(`代理人姓名不能为空: ${agentCode}`)
  }

  ensureMaxLength(name, 100, `代理人姓名过长: ${agentCode}`)

  if (input.designation !== undefined && input.designation !== null && designation === null) {
    throw new Error(`代理人职级必须为整数: ${agentCode}`)
  }

  ensureDateString(joinDate, `代理人加入时间格式无效: ${agentCode}`)
  ensureMaxLength(leaderCode, 8, `直属上级编码过长: ${agentCode}`)
  ensureDateString(lastPromotionDate, `最近晋升时间格式无效: ${agentCode}`)

  for (const [label, value] of [
    ['代理人机构', agency],
    ['代理人分区', division],
    ['代理人分部', branch],
    ['代理人单元', unit],
  ] as const) {
    ensureMaxLength(value, 100, `${label}过长: ${agentCode}`)
  }

  return {
    agentCode,
    name,
    joinDate,
    designation,
    finacingScheme,
    leaderCode,
    lastPromotionDate,
    agency,
    division,
    branch,
    unit,
  }
}

export function buildProfileChanges(
  before: AgentProfileState | null,
  after: AgentProfileState,
): AgentProfileChange[] {
  return AGENT_PROFILE_FIELDS.flatMap((field) => {
    const beforeValue = before?.[field] ?? null
    const afterValue = after[field] ?? null

    if (before && areFieldValuesEqual(beforeValue, afterValue)) {
      return []
    }

    return [{
      field,
      before: toEventValue(beforeValue),
      after: toEventValue(afterValue),
    }]
  })
}

function normalizeNullableInt(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null
  }

  return Number.isInteger(value) ? value : null
}

function normalizeStringArray(value: string[] | null | undefined): string[] | null {
  if (!value) {
    return null
  }

  const items = value
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  return items.length > 0 ? items : null
}

function areStringArraysEqual(
  left: string[] | null | undefined,
  right: string[] | null | undefined,
): boolean {
  if (!left && !right) {
    return true
  }

  if (!left || !right || left.length !== right.length) {
    return false
  }

  return left.every((item, index) => item === right[index])
}

function areFieldValuesEqual(
  left: AgentProfileState[keyof AgentProfileState] | null,
  right: AgentProfileState[keyof AgentProfileState] | null,
): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    return areStringArraysEqual(
      Array.isArray(left) ? left : null,
      Array.isArray(right) ? right : null,
    )
  }

  return left === right
}

function toEventValue(value: AgentProfileState[keyof AgentProfileState] | null): AgentEventValue {
  return Array.isArray(value) ? [...value] : value
}
