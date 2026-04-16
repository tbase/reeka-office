import { type AgentRow } from "@/lib/pru"

type AgentDiffStats = {
  created: number
  updated: number
  deleted: number
}

type AgentDiffSummary = {
  added: number
  modified: number
  removed: number
}

type AgentChangedField = {
  key: keyof Omit<AgentRow, "agent_code">
  previousValue: string
  nextValue: string
}

type AgentDiffRow =
  | {
      changeType: "added"
      marker: "A"
      row: AgentRow
    }
  | {
      changeType: "removed"
      marker: "D"
      row: AgentRow
    }
  | {
      changeType: "modified"
      marker: "M"
      row: AgentRow
      previousRow: AgentRow
      changedFields: AgentChangedField[]
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

function getAgentDiffRowOrder(row: AgentDiffRow) {
  if (row.changeType === "modified") {
    return 0
  }

  if (row.changeType === "removed") {
    return 1
  }

  return 2
}

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

    if (getChangedAgentFields(previous, row).length > 0) {
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

function getChangedAgentFields(previous: AgentRow, next: AgentRow): AgentChangedField[] {
  return AGENT_DIFF_KEYS.flatMap((key) => {
    if (previous[key] === next[key]) {
      return []
    }

    return {
      key,
      previousValue: previous[key],
      nextValue: next[key],
    }
  })
}

function buildAgentDiff(previousRows: AgentRow[], nextRows: AgentRow[]) {
  const previousMap = new Map(previousRows.map((row) => [row.agent_code, row]))
  const nextMap = new Map(nextRows.map((row) => [row.agent_code, row]))
  const agentCodes = [...new Set([...previousMap.keys(), ...nextMap.keys()])].sort((left, right) =>
    left.localeCompare(right),
  )
  const rows: AgentDiffRow[] = []
  const summary: AgentDiffSummary = {
    added: 0,
    modified: 0,
    removed: 0,
  }

  for (const agentCode of agentCodes) {
    const previous = previousMap.get(agentCode)
    const next = nextMap.get(agentCode)

    if (!previous && next) {
      summary.added += 1
      rows.push({
        changeType: "added",
        marker: "A",
        row: next,
      })
      continue
    }

    if (previous && !next) {
      summary.removed += 1
      rows.push({
        changeType: "removed",
        marker: "D",
        row: previous,
      })
      continue
    }

    if (previous && next) {
      const changedFields = getChangedAgentFields(previous, next)

      if (changedFields.length === 0) {
        continue
      }

      summary.modified += 1
      rows.push({
        changeType: "modified",
        marker: "M",
        changedFields,
        previousRow: previous,
        row: next,
      })
    }
  }

  rows.sort((left, right) => {
    const orderDiff = getAgentDiffRowOrder(left) - getAgentDiffRowOrder(right)

    if (orderDiff !== 0) {
      return orderDiff
    }

    return left.row.agent_code.localeCompare(right.row.agent_code)
  })

  return {
    rows,
    summary,
  }
}

export { buildAgentDiff, buildAgentDiffStats, hasAgentDiff }
export type { AgentChangedField, AgentDiffRow, AgentDiffStats, AgentDiffSummary }
