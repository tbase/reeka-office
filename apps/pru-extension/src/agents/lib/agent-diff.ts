import { type AgentRow } from "@/lib/pru"

type AgentDiffStats = {
  created: number
  updated: number
  deleted: number
}

const AGENT_DIFF_KEYS: Array<keyof Omit<AgentRow, "agent_code">> = [
  "pinyin",
  "email",
  "leader_code",
  "join_date",
  "designation",
  "agency",
  "division",
  "branch",
  "unit",
]

function buildAgentDiffStats(previousRows: AgentRow[], nextRows: AgentRow[]) {
  const previousMap = new Map(previousRows.map((row) => [row.agent_code, row]))
  const nextMap = new Map(nextRows.map((row) => [row.agent_code, row]))

  let created = 0
  let updated = 0
  let deleted = 0

  for (const row of nextRows) {
    const previous = previousMap.get(row.agent_code)

    if (!previous) {
      created += 1
      continue
    }

    if (AGENT_DIFF_KEYS.some((key) => previous[key] !== row[key])) {
      updated += 1
    }
  }

  for (const row of previousRows) {
    if (!nextMap.has(row.agent_code)) {
      deleted += 1
    }
  }

  return {
    created,
    updated,
    deleted,
  }
}

function hasAgentDiff(stats: AgentDiffStats) {
  return stats.created > 0 || stats.updated > 0 || stats.deleted > 0
}

export { buildAgentDiffStats, hasAgentDiff }
export type { AgentDiffStats }
