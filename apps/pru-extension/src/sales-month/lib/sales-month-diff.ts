import { type SalesMonthRow } from "@/lib/pru"
import {
  serializeSalesMonthRow,
  type SerializedSalesMonthRow,
} from "@/sales-month/lib/sales-month-format"

type SalesMonthDiffRow =
  | {
      changeType: "added"
      marker: "A"
      row: SerializedSalesMonthRow
    }
  | {
      changeType: "removed"
      marker: "D"
      row: SerializedSalesMonthRow
    }
  | {
      changeType: "modified"
      marker: "M"
      row: SerializedSalesMonthRow
      previousRow: SerializedSalesMonthRow
    }

type SalesMonthDiffSummary = {
  added: number
  modified: number
  removed: number
}

function hasSameSerializedSalesMonthRow(
  previousRow: SerializedSalesMonthRow,
  nextRow: SerializedSalesMonthRow,
) {
  const previousEntries = Object.entries(previousRow)
  const nextEntries = Object.entries(nextRow)

  if (previousEntries.length !== nextEntries.length) {
    return false
  }

  return !nextEntries.some(([key, value]) => previousRow[key as keyof typeof previousRow] !== value)
}

function hasSameSalesMonthRows(previousRows: SalesMonthRow[], nextRows: SalesMonthRow[]) {
  if (previousRows.length !== nextRows.length) {
    return false
  }

  const previousMap = new Map(
    previousRows.map((row) => [row.agent_code, serializeSalesMonthRow(row)]),
  )

  for (const row of nextRows) {
    const previous = previousMap.get(row.agent_code)
    const next = serializeSalesMonthRow(row)

    if (!previous || !hasSameSerializedSalesMonthRow(previous, next)) {
      return false
    }
  }

  return true
}

function buildSalesMonthDiff(previousRows: SalesMonthRow[], nextRows: SalesMonthRow[]) {
  const previousMap = new Map(
    previousRows.map((row) => [row.agent_code, serializeSalesMonthRow(row)]),
  )
  const nextMap = new Map(nextRows.map((row) => [row.agent_code, serializeSalesMonthRow(row)]))
  const agentCodes = [...new Set([...previousMap.keys(), ...nextMap.keys()])].sort((left, right) =>
    left.localeCompare(right),
  )
  const rows: SalesMonthDiffRow[] = []
  const summary: SalesMonthDiffSummary = {
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

    if (previous && next && !hasSameSerializedSalesMonthRow(previous, next)) {
      summary.modified += 1
      rows.push({
        changeType: "modified",
        marker: "M",
        previousRow: previous,
        row: next,
      })
    }
  }

  return {
    rows,
    summary,
  }
}

export { buildSalesMonthDiff, hasSameSalesMonthRows }
export type { SalesMonthDiffRow, SalesMonthDiffSummary }
