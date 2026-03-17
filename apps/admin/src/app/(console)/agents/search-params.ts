export const VALID_AGENT_SORTS = [
  "designation_asc",
  "designation_desc",
  "join_date_asc",
  "join_date_desc",
] as const

export type AgentSort = (typeof VALID_AGENT_SORTS)[number]

export const DEFAULT_AGENT_SORT: AgentSort = "join_date_desc"

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
