import { parseCsv } from "@/lib/csv"
import { type SalesMonthRow } from "@/lib/pru"

function getMonthFromSalesCachePath(path: string) {
  const match = path.match(/^sales-month\/(\d{4})\/(\d{2})-\d{10}\.csv$/)

  if (!match) {
    return ""
  }

  const [, year, month] = match
  return `${year}-${month}`
}

function buildSalesCacheDebugInfo(path: string, content: string, parsedRows: SalesMonthRow[]) {
  const rawRows = parseCsv(content)
  const headers = Object.keys(rawRows[0] ?? {})
  const firstRawRow = rawRows[0] ?? {}
  const firstParsedRow = parsedRows[0] ?? null

  return {
    path,
    headers,
    rawRowCount: rawRows.length,
    parsedRowCount: parsedRows.length,
    firstRawRow: {
      MONTH: firstRawRow.MONTH ?? firstRawRow.month ?? "",
      YEAR: firstRawRow.YEAR ?? firstRawRow.year ?? "",
      AGENT_CODE: firstRawRow.AGENT_CODE ?? firstRawRow.agent_code ?? "",
      PINYIN: firstRawRow.PINYIN ?? firstRawRow.pinyin ?? "",
    },
    firstParsedRow,
  }
}

export { buildSalesCacheDebugInfo, getMonthFromSalesCachePath }
