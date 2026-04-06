import { type CsvColumn, parseCsv, toCsv } from "@/lib/csv"
import { type SalesExtraRow } from "@/lib/pru/contract"
import { normalizeAgentCode, parseStoredMetric, readCsvValue } from "@/lib/pru/shared"
import { type CachedWorkdirFile } from "@/lib/workdir"
import { getDirectoryIfExists, getWorkdirHandle, readWorkdirFile, writeWorkdirFile } from "@/lib/workdir/fs"

type SalesExtraMetrics = Pick<
  SalesExtraRow,
  | "nsc_hp"
  | "nsc_hp_sum"
  | "net_afyp_hp"
  | "net_afyp_hp_sum"
  | "net_afyp_h"
  | "net_afyp_h_sum"
  | "net_case_h"
  | "net_case_h_sum"
  | "renewal_rate_team"
>

const SALES_EXTRA_COLUMNS: CsvColumn<SalesExtraRow>[] = [
  { key: "month", header: "month" },
  { key: "nsc_hp", header: "nsc_hp" },
  { key: "nsc_hp_sum", header: "nsc_hp_sum" },
  { key: "net_afyp_hp", header: "net_afyp_hp" },
  { key: "net_afyp_hp_sum", header: "net_afyp_hp_sum" },
  { key: "net_afyp_h", header: "net_afyp_h" },
  { key: "net_afyp_h_sum", header: "net_afyp_h_sum" },
  { key: "net_case_h", header: "net_case_h" },
  { key: "net_case_h_sum", header: "net_case_h_sum" },
  { key: "renewal_rate_team", header: "renewal_rate_team" },
]

function normalizeSalesExtraMonth(month: string) {
  return month.replace("-", "/")
}

function parseSalesExtraMonth(month: string) {
  const normalized = normalizeSalesExtraMonth(month)
  const match = normalized.match(/^(\d{4})\/(\d{2})$/)

  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    normalized,
  }
}

function buildSalesExtraRelativePath(agentCode: string) {
  const normalized = normalizeAgentCode(agentCode)

  if (!normalized) {
    throw new Error("代理人编号格式不正确")
  }

  return `sales-extra/${normalized}.csv`
}

function parseSalesExtraCsvRow(record: Record<string, string>): SalesExtraRow {
  return {
    month: readCsvValue(record, "month"),
    nsc_hp: parseStoredMetric(readCsvValue(record, "nsc_hp")),
    nsc_hp_sum: parseStoredMetric(readCsvValue(record, "nsc_hp_sum")),
    net_afyp_hp: parseStoredMetric(readCsvValue(record, "net_afyp_hp")),
    net_afyp_hp_sum: parseStoredMetric(readCsvValue(record, "net_afyp_hp_sum")),
    net_afyp_h: parseStoredMetric(readCsvValue(record, "net_afyp_h")),
    net_afyp_h_sum: parseStoredMetric(readCsvValue(record, "net_afyp_h_sum")),
    net_case_h: parseStoredMetric(readCsvValue(record, "net_case_h")),
    net_case_h_sum: parseStoredMetric(readCsvValue(record, "net_case_h_sum")),
    renewal_rate_team: parseStoredMetric(readCsvValue(record, "renewal_rate_team")),
  }
}

function parseSalesExtraCsv(content: string) {
  return parseCsv(content)
    .map(parseSalesExtraCsvRow)
    .filter((row) => /^\d{4}\/\d{2}$/.test(row.month))
    .sort((left, right) => left.month.localeCompare(right.month))
}

function serializeSalesExtraRows(rows: SalesExtraRow[]) {
  return rows.map((row) => ({
    month: row.month,
    nsc_hp: row.nsc_hp,
    nsc_hp_sum: row.nsc_hp_sum,
    net_afyp_hp: row.net_afyp_hp,
    net_afyp_hp_sum: row.net_afyp_hp_sum,
    net_afyp_h: row.net_afyp_h,
    net_afyp_h_sum: row.net_afyp_h_sum,
    net_case_h: row.net_case_h,
    net_case_h_sum: row.net_case_h_sum,
    renewal_rate_team: row.renewal_rate_team,
  }))
}

async function loadSalesExtraRows(agentCode: string) {
  const cachedFile = await loadSalesExtraFile(agentCode)

  if (!cachedFile) {
    return []
  }

  return parseSalesExtraCsv(cachedFile.content)
}

function mergeSalesExtraRows(existingRows: SalesExtraRow[], fetchedRows: SalesExtraRow[]) {
  const merged = new Map(existingRows.map((row) => [row.month, row]))

  fetchedRows.forEach((row) => {
    merged.set(row.month, row)
  })

  return [...merged.values()].sort((left, right) => left.month.localeCompare(right.month))
}

async function loadSalesExtraFile(agentCode: string): Promise<CachedWorkdirFile | null> {
  const handle = await getWorkdirHandle()
  const salesExtraDirectory = await getDirectoryIfExists(handle, "sales-extra")

  if (!salesExtraDirectory) {
    return null
  }

  const relativePath = buildSalesExtraRelativePath(agentCode)

  try {
    return await readWorkdirFile(salesExtraDirectory, relativePath)
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      return null
    }

    throw error
  }
}

async function writeSalesExtraFile(agentCode: string, content: string) {
  await writeWorkdirFile(buildSalesExtraRelativePath(agentCode), content)
}

async function saveMergedSalesExtraRows(agentCode: string, fetchedRows: SalesExtraRow[]) {
  const existingRows = await loadSalesExtraRows(agentCode)
  const mergedRows = mergeSalesExtraRows(existingRows, fetchedRows)

  await writeSalesExtraFile(agentCode, toSalesExtraCsv(mergedRows))

  return mergedRows
}

async function loadExtraSalesMetricsForMonth(agentCode: string, month: string): Promise<SalesExtraMetrics | null> {
  const targetMonth = normalizeSalesExtraMonth(month)
  const row = (await loadSalesExtraRows(agentCode)).find((entry) => entry.month === targetMonth)

  if (!row) {
    return null
  }

  return {
    nsc_hp: row.nsc_hp,
    nsc_hp_sum: row.nsc_hp_sum,
    net_afyp_hp: row.net_afyp_hp,
    net_afyp_hp_sum: row.net_afyp_hp_sum,
    net_afyp_h: row.net_afyp_h,
    net_afyp_h_sum: row.net_afyp_h_sum,
    net_case_h: row.net_case_h,
    net_case_h_sum: row.net_case_h_sum,
    renewal_rate_team: row.renewal_rate_team,
  }
}

function toSalesExtraCsv(rows: SalesExtraRow[]) {
  return toCsv(serializeSalesExtraRows(rows), SALES_EXTRA_COLUMNS)
}

function isSalesExtraFetchable(month: string, now = new Date()) {
  const target = parseSalesExtraMonth(month)

  if (!target) {
    return false
  }

  const earliestFetchable = new Date(now.getFullYear(), now.getMonth() - 23, 1)
  const targetDate = new Date(target.year, target.month - 1, 1)

  return targetDate >= earliestFetchable
}

export {
  buildSalesExtraRelativePath,
  isSalesExtraFetchable,
  loadExtraSalesMetricsForMonth,
  loadSalesExtraFile,
  loadSalesExtraRows,
  mergeSalesExtraRows,
  parseSalesExtraCsv,
  saveMergedSalesExtraRows,
  serializeSalesExtraRows,
  toSalesExtraCsv,
  writeSalesExtraFile,
}

export type { SalesExtraMetrics }
