import { parseCsv } from "@/lib/csv"
import {
  REQUEST_INTERVAL_MS,
  type FetchSalesMonthResult,
  type ProgressHandler,
  type SalesMonthCacheStats,
  type SalesMonthRow,
} from "@/lib/pru/contract"
import {
  fetchAesHtml,
  normalizeAgentCode,
  parseHtml,
  parseMetric,
  parseStoredMetric,
  sleep,
  textContent,
  unique,
} from "@/lib/pru/shared"

type AgentIdentifier = {
  agent_code: string
  pinyin: string
}

type SalesData = Omit<SalesMonthRow, "agent_code" | "pinyin"> & {
  agent: AgentIdentifier
}

type ExtraSalesMetrics = Pick<
  SalesMonthRow,
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

type ExtraSalesDecision = {
  type: "reuse-full" | "reuse-sum-only" | "refresh"
  metrics: ExtraSalesMetrics
}

type ParsedHpSale = Pick<SalesMonthRow, "month" | "nsc_hp" | "net_afyp_hp">
type ParsedHSale = Pick<SalesMonthRow, "month" | "net_afyp_h" | "net_case_h">
type ParsedRenewalRate = Pick<SalesMonthRow, "month" | "renewal_rate_team">

type SalesDecisionEntry = {
  sale: SalesData
  cached?: SalesMonthRow
  decision: ExtraSalesDecision
}

const EXTRA_SALES_FIELDS = [
  "nsc_hp",
  "nsc_hp_sum",
  "net_afyp_hp",
  "net_afyp_hp_sum",
  "net_afyp_h",
  "net_afyp_h_sum",
  "net_case_h",
  "net_case_h_sum",
  "renewal_rate_team",
] as const satisfies ReadonlyArray<keyof ExtraSalesMetrics>

const SALES_MONTH_NUMERIC_FIELDS = [
  "net_afyp",
  "net_afyp_assigned",
  "net_case",
  "net_case_assigned",
  "nsc",
  "is_qualified",
  "is_qualified_assigned",
  "net_afyp_sum",
  "net_afyp_assigned_sum",
  "net_case_sum",
  "net_case_assigned_sum",
  "nsc_sum",
  "net_afyc_sum",
  "nsc_hp",
  "nsc_hp_sum",
  "net_afyp_hp",
  "net_afyp_hp_sum",
  "net_afyp_h",
  "net_afyp_h_sum",
  "net_case_h",
  "net_case_h_sum",
  "renewal_rate_team",
] as const satisfies ReadonlyArray<keyof SalesMonthRow>

function formatMonthSlash(month: string) {
  const [year, monthPart] = month.split("-")
  return `${year}/${monthPart}`
}

function parseYearMonth(month: string) {
  const match = month.match(/^(\d{4})\/(\d{2})$/)

  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  }
}

function getPreviousYearMonth(month: string) {
  const parts = parseYearMonth(month)

  if (!parts) {
    return ""
  }

  const date = new Date(parts.year, parts.month - 2, 1)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function toMonthInputValue(month: string) {
  const match = month.match(/^(\d{4})\/(\d{2})$/)

  if (!match) {
    return ""
  }

  const [, year, monthPart] = match
  return `${year}-${monthPart}`
}

function parseAgentCell(html: string): AgentIdentifier {
  const lines = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    agent_code: normalizeAgentCode(lines[0]?.split(/\s+/).at(-1) ?? ""),
    pinyin: lines[1] ?? "",
  }
}

function emptyExtraSalesMetrics(): ExtraSalesMetrics {
  return {
    nsc_hp: 0,
    nsc_hp_sum: 0,
    net_afyp_hp: 0,
    net_afyp_hp_sum: 0,
    net_afyp_h: 0,
    net_afyp_h_sum: 0,
    net_case_h: 0,
    net_case_h_sum: 0,
    renewal_rate_team: 0,
  }
}

function hasSameExtraSalesSnapshot(sale: SalesData, cached: SalesMonthRow) {
  return cached.year === sale.year && cached.nsc_sum === sale.nsc_sum
}

function canReusePreviousMonthExtraSales(sale: SalesData, cached: SalesMonthRow) {
  return cached.year === sale.year && cached.month === getPreviousYearMonth(sale.month)
}

function normalizeHpMonth(text: string) {
  const match = text.trim().match(/^(\d{2})[-/](\d{4})$/)

  if (!match) {
    return null
  }

  const [, month, year] = match
  return `${year}/${month}`
}

function sortByMonth<T extends { month: string }>(rows: T[]) {
  return rows.sort((left, right) => left.month.localeCompare(right.month))
}

function getCurrentMetric<T extends { month: string }>(rows: T[], month: string) {
  return rows.find((row) => row.month === month)
}

function readCsvValue(record: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (value !== undefined) {
      return value
    }
  }

  return ""
}

function inferYearFromMonth(month: string) {
  return month.match(/^(\d{4})\/\d{2}$/)?.[1] ?? ""
}

function isWithinTargetYear(
  rowMonth: string | null,
  targetMonth: string,
  targetYear: string,
): rowMonth is string {
  return !!rowMonth && rowMonth.startsWith(`${targetYear}/`) && rowMonth <= targetMonth
}

function getTargetPeriod(month: string) {
  const targetMonth = formatMonthSlash(month)

  return {
    targetMonth,
    targetYear: targetMonth.split("/")[0] ?? "",
  }
}

function toExtraSalesMetrics(source: Partial<ExtraSalesMetrics>) {
  return EXTRA_SALES_FIELDS.reduce<ExtraSalesMetrics>(
    (metrics, key) => {
      metrics[key] = source[key] ?? 0
      return metrics
    },
    emptyExtraSalesMetrics(),
  )
}

function parseSalesMonthCsvRow(record: Record<string, string>): SalesMonthRow {
  const month = readCsvValue(record, "month")
  const numericMetrics = SALES_MONTH_NUMERIC_FIELDS.reduce<
    Pick<SalesMonthRow, (typeof SALES_MONTH_NUMERIC_FIELDS)[number]>
  >((metrics, key) => {
    metrics[key] = parseStoredMetric(readCsvValue(record, key))
    return metrics
  }, {} as Pick<SalesMonthRow, (typeof SALES_MONTH_NUMERIC_FIELDS)[number]>)

  return {
    month,
    year: readCsvValue(record, "year") || inferYearFromMonth(month),
    agent_code: normalizeAgentCode(readCsvValue(record, "agent_code")),
    pinyin: readCsvValue(record, "pinyin"),
    ...numericMetrics,
  }
}

function extractSaleDataRow(currentRow: HTMLTableRowElement, nextRow: HTMLTableRowElement): SalesData {
  const currentCells = Array.from(currentRow.querySelectorAll("td"))
  const nextCells = Array.from(nextRow.querySelectorAll("td"))

  return {
    month: "",
    year: "",
    agent: parseAgentCell(currentCells[0]?.innerHTML ?? ""),
    net_afyp: parseMetric(textContent(currentCells[3])),
    net_afyp_assigned: parseMetric(textContent(nextCells[3])),
    net_case: parseMetric(textContent(currentCells[4])),
    net_case_assigned: parseMetric(textContent(nextCells[4])),
    nsc: parseMetric(textContent(currentCells[8])),
    is_qualified: parseMetric(textContent(currentCells[6])),
    is_qualified_assigned: parseMetric(textContent(nextCells[6])),
    net_afyp_sum: parseMetric(textContent(currentCells[9])),
    net_afyp_assigned_sum: parseMetric(textContent(nextCells[9])),
    net_case_sum: parseMetric(textContent(currentCells[10])),
    net_case_assigned_sum: parseMetric(textContent(nextCells[10])),
    nsc_sum: parseMetric(textContent(currentCells[14])),
    net_afyc_sum: parseMetric(textContent(currentCells[11])),
    ...emptyExtraSalesMetrics(),
  }
}

function parseSubAgentCodes(html: string, month: string) {
  const document = parseHtml(html)

  return unique(
    Array.from(document.querySelectorAll("td a"))
      .map((link) => link.getAttribute("href") ?? "")
      .filter((href) =>
        href.startsWith(
          `/aes/AESServlet?module=agent&type=iPC&topMenu=myProduction&purpose=getGroupProductionDtl&productionMth=${month}&agentCd=`,
        ),
      )
      .map((href) => href.split("&agentCd=")[1] ?? "")
      .map(normalizeAgentCode)
      .filter(Boolean),
  )
}

function parseSalesRows(html: string, month: string) {
  const document = parseHtml(html)
  const monthCell = Array.from(document.querySelectorAll("td")).find(
    (cell) => textContent(cell) === month,
  )
  const body = monthCell?.closest("tbody")
  const rows = Array.from(body?.querySelectorAll("tr") ?? [])
  const sales: SalesData[] = []

  rows.forEach((row, index) => {
    if (!(row instanceof HTMLTableRowElement)) {
      return
    }

    if (row.getAttribute("bgcolor") === "lightgrey" || index < 2 || index % 2 !== 0) {
      return
    }

    const nextRow = rows[index + 1]

    if (!(nextRow instanceof HTMLTableRowElement)) {
      return
    }

    const sale = extractSaleDataRow(row, nextRow)

    if (!sale.agent.agent_code) {
      return
    }

    sale.month = formatMonthSlash(month)
    sale.year = month.split("-")[0] ?? ""
    sales.push(sale)
  })

  return sales
}

function parseSaleHpHistory(html: string, month: string): ParsedHpSale[] {
  const document = parseHtml(html)
  const { targetMonth, targetYear } = getTargetPeriod(month)
  const rows: ParsedHpSale[] = []

  Array.from(document.querySelectorAll("tr")).forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"))
    const rowMonth = normalizeHpMonth(textContent(cells[0]))

    if (!isWithinTargetYear(rowMonth, targetMonth, targetYear)) {
      return
    }

    rows.push({
      month: rowMonth,
      net_afyp_hp: parseMetric(textContent(cells[1])),
      nsc_hp: parseMetric(textContent(cells[3])),
    })
  })

  return sortByMonth(rows)
}

function parseSaleHHistory(html: string, month: string): ParsedHSale[] {
  const document = parseHtml(html)
  const { targetMonth, targetYear } = getTargetPeriod(month)
  const rows: ParsedHSale[] = []

  Array.from(document.querySelectorAll("tr")).forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"))
    const rowMonth = normalizeHpMonth(textContent(cells[0]).padStart(7, "0"))

    if (!isWithinTargetYear(rowMonth, targetMonth, targetYear)) {
      return
    }

    rows.push({
      month: rowMonth,
      net_afyp_h: parseMetric(textContent(cells[1])),
      net_case_h: parseMetric(textContent(cells[2])),
    })
  })

  return sortByMonth(rows)
}

function parseRenewalRateTeamHistory(html: string, month: string): ParsedRenewalRate[] {
  const document = parseHtml(html)
  const { targetMonth, targetYear } = getTargetPeriod(month)
  const title = Array.from(document.querySelectorAll("h3")).find(
    (node) => textContent(node) === "All (LIFE)",
  )
  const table = title?.nextElementSibling
  const rows = Array.from(table?.querySelectorAll("tr.data1, tr.data2") ?? [])
  const renewalRates: ParsedRenewalRate[] = []

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"))
    const year = textContent(cells[1])
    const monthPart = textContent(cells[0]).padStart(2, "0")
    const rowMonth = `${year}/${monthPart}`

    if (!year || !isWithinTargetYear(rowMonth, targetMonth, targetYear)) {
      return
    }

    renewalRates.push({
      month: rowMonth,
      renewal_rate_team: parseMetric(textContent(cells[7])),
    })
  })

  return sortByMonth(renewalRates)
}

function buildExtraSalesMetrics(
  month: string,
  hpRows: ParsedHpSale[],
  hRows: ParsedHSale[],
  renewalRates: ParsedRenewalRate[],
): ExtraSalesMetrics {
  const targetMonth = formatMonthSlash(month)
  const currentHp = getCurrentMetric(hpRows, targetMonth)
  const currentH = getCurrentMetric(hRows, targetMonth)
  const currentRenewalRate = getCurrentMetric(renewalRates, targetMonth)

  return {
    nsc_hp: currentHp?.nsc_hp ?? 0,
    nsc_hp_sum: hpRows.reduce((sum, row) => sum + row.nsc_hp, 0),
    net_afyp_hp: currentHp?.net_afyp_hp ?? 0,
    net_afyp_hp_sum: hpRows.reduce((sum, row) => sum + row.net_afyp_hp, 0),
    net_afyp_h: currentH?.net_afyp_h ?? 0,
    net_afyp_h_sum: hRows.reduce((sum, row) => sum + row.net_afyp_h, 0),
    net_case_h: currentH?.net_case_h ?? 0,
    net_case_h_sum: hRows.reduce((sum, row) => sum + row.net_case_h, 0),
    renewal_rate_team: currentRenewalRate?.renewal_rate_team ?? 0,
  }
}

function resolveExtraSalesMetrics(
  sale: SalesData,
  cached: SalesMonthRow | undefined,
): ExtraSalesDecision {
  if (!cached || !hasSameExtraSalesSnapshot(sale, cached)) {
    return {
      type: "refresh",
      metrics: emptyExtraSalesMetrics(),
    }
  }

  if (cached.month === sale.month) {
    return {
      type: "reuse-full",
      metrics: toExtraSalesMetrics(cached),
    }
  }

  if (canReusePreviousMonthExtraSales(sale, cached)) {
    return {
      type: "reuse-sum-only",
      metrics: toExtraSalesMetrics({
        nsc_hp_sum: cached.nsc_hp_sum,
        net_afyp_hp_sum: cached.net_afyp_hp_sum,
        net_afyp_h_sum: cached.net_afyp_h_sum,
        net_case_h_sum: cached.net_case_h_sum,
        renewal_rate_team: cached.renewal_rate_team,
      }),
    }
  }

  return {
    type: "refresh",
    metrics: emptyExtraSalesMetrics(),
  }
}

function buildSalesDecisions(salesRows: SalesData[], cacheRows?: SalesMonthRow[]) {
  const cacheMap = new Map(cacheRows?.map((row) => [row.agent_code, row]) ?? [])

  return salesRows.map((sale) => {
    const cached = cacheMap.get(sale.agent.agent_code)

    return {
      sale,
      cached,
      decision: resolveExtraSalesMetrics(sale, cached),
    }
  })
}

function logExtraSalesDecisions(salesDecisions: SalesDecisionEntry[]) {
  console.info(
    "[sales-month] extra-sales decisions",
    salesDecisions.map(({ sale, cached, decision }) => ({
      agent_code: sale.agent.agent_code,
      sale_month: sale.month,
      cached_month: cached?.month ?? "",
      cached_nsc_sum: cached?.nsc_sum ?? null,
      sale_nsc_sum: sale.nsc_sum,
      decision: decision.type,
    })),
  )

  console.info(
    "[sales-month] extra-sales refresh targets",
    salesDecisions
      .filter(({ decision }) => decision.type === "refresh")
      .map(({ sale, cached }) => ({
        agent_code: sale.agent.agent_code,
        sale_month: sale.month,
        cached_month: cached?.month ?? "",
        cached_nsc_sum: cached?.nsc_sum ?? null,
        sale_nsc_sum: sale.nsc_sum,
      })),
  )
}

function countRefreshTargets(salesDecisions: SalesDecisionEntry[]) {
  return new Set(
    salesDecisions
      .filter(({ decision }) => decision.type === "refresh")
      .map(({ sale }) => sale.agent.agent_code),
  ).size
}

function toSalesMonthRow(sale: SalesData, extraSalesMetrics: ExtraSalesMetrics): SalesMonthRow {
  return {
    ...sale,
    ...extraSalesMetrics,
    agent_code: sale.agent.agent_code,
    pinyin: sale.agent.pinyin,
  }
}

async function getProductionHtml(agentCode: string, month: string) {
  return fetchAesHtml("getGroupProductionDtl", {
    agentCd: agentCode,
    productionMth: month,
  })
}

async function getSubAgentCodes(agentCode: string, month: string) {
  return parseSubAgentCodes(await getProductionHtml(agentCode, month), month)
}

async function getSalesData(agentCode: string, month: string) {
  return parseSalesRows(await getProductionHtml(agentCode, month), month)
}

async function getSaleHpHistory(agentCode: string, month: string) {
  return parseSaleHpHistory(
    await fetchAesHtml("getAnHBusiness", {
      agentCd: agentCode,
      func: "AnH_CHECK",
      prodPeriod: "12",
    }),
    month,
  )
}

async function getSaleHHistory(agentCode: string, month: string) {
  return parseSaleHHistory(
    await fetchAesHtml("getHealthBusiness", {
      agentCd: agentCode,
      func: "HB_CHECK",
      prodPeriod: "12",
    }),
    month,
  )
}

async function getRenewalRateTeamHistory(agentCode: string, month: string) {
  return parseRenewalRateTeamHistory(
    await fetchAesHtml("getPreviousGroupProduction", {
      agentCd: agentCode,
      prodPeriod: "12",
    }),
    month,
  )
}

async function fetchExtraSalesFull(agentCode: string, month: string) {
  const [hpRows, hRows, renewalRates] = await Promise.all([
    getSaleHpHistory(agentCode, month),
    getSaleHHistory(agentCode, month),
    getRenewalRateTeamHistory(agentCode, month),
  ])

  return buildExtraSalesMetrics(month, hpRows, hRows, renewalRates)
}

async function materializeSalesRows(
  salesDecisions: SalesDecisionEntry[],
  month: string,
  onProgress?: ProgressHandler,
) {
  const rows: SalesMonthRow[] = []
  const cache: SalesMonthCacheStats = {
    reusedFull: 0,
    reusedSumOnly: 0,
    refreshed: 0,
  }
  const extraSalesRequestCache = new Map<string, ExtraSalesMetrics>()
  const totalExtraSalesRefreshCount = countRefreshTargets(salesDecisions)
  let completedExtraSalesRefreshCount = 0

  for (const { sale, decision } of salesDecisions) {
    let extraSalesMetrics = decision.metrics

    if (decision.type === "reuse-full") {
      cache.reusedFull += 1
    } else if (decision.type === "reuse-sum-only") {
      cache.reusedSumOnly += 1
    } else if (extraSalesRequestCache.has(sale.agent.agent_code)) {
      extraSalesMetrics = extraSalesRequestCache.get(sale.agent.agent_code)!
    } else {
      completedExtraSalesRefreshCount += 1
      onProgress?.(
        `补拉额外信息 ${completedExtraSalesRefreshCount}/${totalExtraSalesRefreshCount}: ${sale.agent.agent_code}`,
      )

      extraSalesMetrics = await fetchExtraSalesFull(sale.agent.agent_code, month)
      cache.refreshed += 1
      extraSalesRequestCache.set(sale.agent.agent_code, extraSalesMetrics)
      await sleep(REQUEST_INTERVAL_MS)
    }

    rows.push(toSalesMonthRow(sale, extraSalesMetrics))
  }

  return { rows, cache }
}

export function parseSalesMonthCsv(content: string) {
  return parseCsv(content)
    .map(parseSalesMonthCsvRow)
    .filter((row) => row.agent_code && row.year && row.month)
}

export async function fetchSalesMonth(
  agentCode: string,
  month: string,
  options?: {
    onProgress?: ProgressHandler
    cacheRows?: SalesMonthRow[]
    cacheSourcePath?: string
  },
): Promise<FetchSalesMonthResult> {
  const onProgress = options?.onProgress

  onProgress?.("读取团队成员列表...")
  const agentCodes = [normalizeAgentCode(agentCode), ...(await getSubAgentCodes(agentCode, month))]
  const uniqueCodes = unique(agentCodes)
  const salesRows: SalesData[] = []

  for (const [index, code] of uniqueCodes.entries()) {
    onProgress?.(`读取月业绩 ${index + 1}/${uniqueCodes.length}: ${code}`)
    salesRows.push(...(await getSalesData(code, month)))
    await sleep(REQUEST_INTERVAL_MS)
  }

  onProgress?.("比对历史缓存...")
  const salesDecisions = buildSalesDecisions(salesRows, options?.cacheRows)

  logExtraSalesDecisions(salesDecisions)

  const { rows, cache } = await materializeSalesRows(salesDecisions, month, onProgress)

  return {
    rows,
    cacheSourcePath: options?.cacheSourcePath ?? "",
    cache,
  }
}
