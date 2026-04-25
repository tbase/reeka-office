export const VALID_AGENT_SORTS = [
  "designation_asc",
  "designation_desc",
  "join_date_asc",
  "join_date_desc",
] as const

const VALID_AGENT_LOG_CATEGORIES = ["profile", "apm"] as const
const LOG_FILTER_PARAM_NAMES = new Set(["category", "month"])
const MONTH_FILTER_RE = /^\d{4}-\d{2}$/

export type AgentSort = (typeof VALID_AGENT_SORTS)[number]
export type AgentLogCategory = (typeof VALID_AGENT_LOG_CATEGORIES)[number]
export type AgentLogCategoryFilter = AgentLogCategory | "all"
export type SearchParamsValue = string | string[] | undefined
export type SearchParamsRecord = Record<string, SearchParamsValue>

export interface AgentLogsSearchParams {
  category: AgentLogCategoryFilter
  month: string
}

export const DEFAULT_AGENT_SORT: AgentSort = "designation_desc"

export function parseAgentSort(value: string | undefined): AgentSort {
  if (VALID_AGENT_SORTS.includes(value as AgentSort)) {
    return value as AgentSort
  }

  return DEFAULT_AGENT_SORT
}

export function parseAgencyFilter(value: string | undefined): string | null {
  const agency = value?.trim()

  return agency ? agency : null
}

function getFirstSearchParamValue(value: SearchParamsValue): string | undefined {
  if (Array.isArray(value)) {
    return value.find((item) => item.length > 0)
  }

  return value
}

function createSearchParams(
  params: SearchParamsRecord,
  excludedKeys: Set<string> = new Set(),
): URLSearchParams {
  const nextParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (excludedKeys.has(key)) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          nextParams.append(key, item)
        }
      }
      continue
    }

    if (value) {
      nextParams.set(key, value)
    }
  }

  return nextParams
}

export function parseAgentLogCategory(
  value: string | undefined,
): AgentLogCategoryFilter {
  if (VALID_AGENT_LOG_CATEGORIES.includes(value as AgentLogCategory)) {
    return value as AgentLogCategory
  }

  return "all"
}

function getCurrentMonthValue() {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}`
}

export function parseAgentLogMonth(value: string | undefined): string {
  if (!value) {
    return getCurrentMonthValue()
  }

  return MONTH_FILTER_RE.test(value) ? value : getCurrentMonthValue()
}

export function parseAgentLogsSearchParams(
  params: SearchParamsRecord,
): AgentLogsSearchParams {
  return {
    category: parseAgentLogCategory(getFirstSearchParamValue(params.category)),
    month: parseAgentLogMonth(getFirstSearchParamValue(params.month)),
  }
}

export function buildAgentsListHref(params: SearchParamsRecord = {}): string {
  const searchParams = createSearchParams(params, LOG_FILTER_PARAM_NAMES)
  const query = searchParams.toString()

  return query ? `/agents?${query}` : "/agents"
}

export function buildAgentLogsHref(
  agentCode: string,
  params: SearchParamsRecord = {},
): string {
  const searchParams = createSearchParams(params, LOG_FILTER_PARAM_NAMES)
  const query = searchParams.toString()
  const pathname = `/agents/${encodeURIComponent(agentCode)}/logs`

  return query ? `${pathname}?${query}` : pathname
}
