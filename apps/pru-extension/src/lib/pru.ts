import { parseCsv } from "@/lib/csv"
import { getCookiesForUrl } from "@/lib/chrome"

const AES_URL = "https://aes.prudential.com.hk/"
const SALESFORCE_URL = "https://salesforce.prudential.com.hk/"
const AES_ENDPOINT = "https://aes.prudential.com.hk/aes/AESServlet?type=iPC&module=agent"
const REQUEST_INTERVAL_MS = 800
const AGENT_CODE_PATTERN = /^0\d{7}$/

export type AgentRow = {
  agent_code: string
  pinyin: string
  designation: string
  leader_code: string
  join_date: string
  financing_scheme: string
  financing_advance: string
  agency: string
  division: string
}

export type SalesMonthRow = {
  month: string
  year: string
  agent_code: string
  pinyin: string
  net_afyp: number
  net_afyp_assigned: number
  net_case: number
  net_case_assigned: number
  nsc: number
  is_qualified: number
  is_qualified_assigned: number
  net_afyp_sum: number
  net_afyp_assigned_sum: number
  net_case_sum: number
  net_case_assigned_sum: number
  nsc_sum: number
  net_afyc_sum: number
  nsc_hp: number
  nsc_hp_sum: number
  net_afyp_hp: number
  net_afyp_hp_sum: number
  net_afyp_h: number
  net_afyp_h_sum: number
  net_case_h: number
  net_case_h_sum: number
  renewal_rate_team: number
}

export type SalesMonthCacheStats = {
  reusedFull: number
  reusedSumOnly: number
  refreshed: number
}

export type FetchSalesMonthResult = {
  rows: SalesMonthRow[]
  cacheSourcePath: string
  cache: SalesMonthCacheStats
}

type ProgressHandler = (message: string) => void

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

type ParsedHpSale = Pick<SalesMonthRow, "month" | "nsc_hp" | "net_afyp_hp">
type ParsedHSale = Pick<SalesMonthRow, "month" | "net_afyp_h" | "net_case_h">
type ParsedRenewalRate = Pick<SalesMonthRow, "month" | "renewal_rate_team">

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function unique<T>(items: T[]) {
  return [...new Set(items)]
}

function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html")
}

function textContent(node: Element | null | undefined) {
  return node?.textContent?.trim() ?? ""
}

function normalizeAgentCode(value: string) {
  const normalized = value.trim()
  return AGENT_CODE_PATTERN.test(normalized) ? normalized : ""
}

function valueFromLabel(cells: Element[], label: string) {
  const index = cells.findIndex((cell) => textContent(cell) === label)

  if (index === -1) {
    return ""
  }

  return textContent(cells[index + 1])
}

function parseDdMmYyyy(text: string) {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!match) {
    return ""
  }

  const [, day, month, year] = match
  return `${year}/${month}/${day}`
}

function parseMetric(text: string, factor = 100) {
  const normalized = text.replaceAll(",", "").trim()
  const numeric = Number(normalized)

  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.ceil(numeric * factor)
}

function parseStoredMetric(text: string) {
  const normalized = text.trim()
  const numeric = Number(normalized)

  if (!Number.isFinite(numeric)) {
    return 0
  }

  return numeric
}

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

  const codeLine = lines[0] ?? ""
  const agentCode = normalizeAgentCode(codeLine.split(/\s+/).at(-1) ?? "")

  return {
    agent_code: agentCode,
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

function getCombinedCookieHeader(cookies: chrome.cookies.Cookie[]) {
  return cookies
    .filter((cookie) => cookie.name && cookie.value)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")
}

async function fetchAesHtml(
  purpose: string,
  data: Record<string, string>,
  retryCount = 0,
): Promise<string> {
  const [aesCookies, salesforceCookies] = await Promise.all([
    getCookiesForUrl(AES_URL),
    getCookiesForUrl(SALESFORCE_URL),
  ])

  const cookieHeader = getCombinedCookieHeader([...aesCookies, ...salesforceCookies])

  if (!cookieHeader) {
    throw new Error("未读取到 PRU Cookie，请先在当前 Chrome Profile 中登录 AES 和 Salesforce")
  }

  const response = await fetch(`${AES_ENDPOINT}&purpose=${purpose}`, {
    method: "POST",
    body: new URLSearchParams(data),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Cookie: cookieHeader,
    },
    redirect: "manual",
  })

  if (response.status === 0 || response.type === "opaqueredirect") {
    throw new Error("登录状态已失效，请重新登录 PRU")
  }

  const html = await response.text()

  if (html.includes("Error : 32")) {
    if (retryCount >= 2) {
      throw new Error(`PRU 页面返回异常，重试失败: ${purpose}`)
    }

    await sleep(500)
    return fetchAesHtml(purpose, data, retryCount + 1)
  }

  return html
}

async function getSubordinateAgentCodes(agentCode: string) {
  const html = await fetchAesHtml("getSubordinate", {
    agentCd: agentCode,
  })
  const document = parseHtml(html)
  const links = document.querySelectorAll(
    'a[href^="/aes/AESServlet?type=iPC&module=agent&purpose=getAgentInfo&agentCd="]',
  )

  return unique([
    normalizeAgentCode(agentCode),
    ...Array.from(links)
      .map((link) => textContent(link))
      .map(normalizeAgentCode)
      .filter(Boolean),
  ])
}

async function getAgentDetails(agentCode: string): Promise<AgentRow> {
  const html = await fetchAesHtml("getAgentInfo", {
    agentCd: agentCode,
  })
  const document = parseHtml(html)
  const tables = Array.from(document.querySelectorAll('form[name="frmAgtInfo"] table'))
  const basicRows = Array.from(tables[0]?.querySelectorAll("tr") ?? [])
  const extraCells = Array.from(tables[2]?.querySelectorAll("td") ?? [])

  const pinyin = textContent(basicRows[1]?.querySelectorAll("td")[1])
  const divisionText = textContent(basicRows[2]?.querySelectorAll("td")[1])
  const designationText = textContent(basicRows[5]?.querySelectorAll("td")[1])
  const leaderText = textContent(basicRows[6]?.querySelectorAll("td")[1])

  return {
    agent_code: agentCode,
    pinyin,
    designation: designationText.match(/\(([^)]+)\)/)?.[1] ?? "",
    leader_code: normalizeAgentCode(leaderText.split(" ")[0] ?? ""),
    join_date: parseDdMmYyyy(valueFromLabel(extraCells, "First FC Dt.")),
    financing_scheme: valueFromLabel(extraCells, "Financing Scheme"),
    financing_advance: valueFromLabel(extraCells, "Financing Advance"),
    agency: valueFromLabel(extraCells, "Agency Name"),
    division: divisionText.split(" ")[1] ?? "",
  }
}

export async function fetchAgents(agentCode: string, onProgress?: ProgressHandler) {
  onProgress?.("读取成员列表...")
  const agentCodes = await getSubordinateAgentCodes(agentCode)
  const rows: AgentRow[] = []

  for (const [index, code] of agentCodes.entries()) {
    onProgress?.(`读取成员信息 ${index + 1}/${agentCodes.length}: ${code}`)
    rows.push(await getAgentDetails(code))
    await sleep(REQUEST_INTERVAL_MS)
  }

  return rows
}

async function getProductionHtml(agentCode: string, month: string) {
  return fetchAesHtml("getGroupProductionDtl", {
    agentCd: agentCode,
    productionMth: month,
  })
}

async function getSubAgentCodes(agentCode: string, month: string) {
  const html = await getProductionHtml(agentCode, month)
  const document = parseHtml(html)
  const links = Array.from(document.querySelectorAll("td a"))
    .map((link) => link.getAttribute("href") ?? "")
    .filter((href) =>
      href.startsWith(
        `/aes/AESServlet?module=agent&type=iPC&topMenu=myProduction&purpose=getGroupProductionDtl&productionMth=${month}&agentCd=`,
      ),
    )
    .map((href) => href.split("&agentCd=")[1] ?? "")
    .map(normalizeAgentCode)
    .filter(Boolean)

  return unique(links)
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

    if (row.getAttribute("bgcolor") === "lightgrey") {
      return
    }

    if (index < 2 || index % 2 !== 0) {
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

async function getSalesData(agentCode: string, month: string) {
  const html = await getProductionHtml(agentCode, month)
  return parseSalesRows(html, month)
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

async function getSaleHpHistory(agentCode: string, month: string): Promise<ParsedHpSale[]> {
  const html = await fetchAesHtml("getAnHBusiness", {
    agentCd: agentCode,
    func: "AnH_CHECK",
    prodPeriod: "12",
  })
  const document = parseHtml(html)
  const targetMonth = formatMonthSlash(month)
  const targetYear = targetMonth.split("/")[0]
  const rows: ParsedHpSale[] = []

  Array.from(document.querySelectorAll("tr")).forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"))
    const rowMonth = normalizeHpMonth(textContent(cells[0]))

    if (!rowMonth || !rowMonth.startsWith(`${targetYear}/`)) {
      return
    }

    if (rowMonth > targetMonth) {
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

async function getSaleHHistory(agentCode: string, month: string): Promise<ParsedHSale[]> {
  const html = await fetchAesHtml("getHealthBusiness", {
    agentCd: agentCode,
    func: "HB_CHECK",
    prodPeriod: "12",
  })
  const document = parseHtml(html)
  const targetMonth = formatMonthSlash(month)
  const targetYear = targetMonth.split("/")[0]
  const rows: ParsedHSale[] = []

  Array.from(document.querySelectorAll("tr")).forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"))
    const rowMonth = normalizeHpMonth(textContent(cells[0]).padStart(7, "0"))

    if (!rowMonth || !rowMonth.startsWith(`${targetYear}/`)) {
      return
    }

    if (rowMonth > targetMonth) {
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

async function getRenewalRateTeamHistory(agentCode: string, month: string): Promise<ParsedRenewalRate[]> {
  const html = await fetchAesHtml("getPreviousGroupProduction", {
    agentCd: agentCode,
    prodPeriod: "12",
  })
  const document = parseHtml(html)
  const targetMonth = formatMonthSlash(month)
  const targetYear = targetMonth.split("/")[0]
  const title = Array.from(document.querySelectorAll("h3")).find((node) => textContent(node) === "All (LIFE)")
  const table = title?.nextElementSibling
  const rows = Array.from(table?.querySelectorAll("tr.data1, tr.data2") ?? [])
  const renewalRates: ParsedRenewalRate[] = []

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"))
    const year = textContent(cells[1])
    const monthPart = textContent(cells[0]).padStart(2, "0")
    const rowMonth = `${year}/${monthPart}`

    if (!year || rowMonth.split("/")[0] !== targetYear || rowMonth > targetMonth) {
      return
    }

    renewalRates.push({
      month: rowMonth,
      renewal_rate_team: parseMetric(textContent(cells[7])),
    })
  })

  return sortByMonth(renewalRates)
}

async function fetchExtraSalesFull(agentCode: string, month: string): Promise<ExtraSalesMetrics> {
  const targetMonth = formatMonthSlash(month)
  const [hpRows, hRows, renewalRates] = await Promise.all([
    getSaleHpHistory(agentCode, month),
    getSaleHHistory(agentCode, month),
    getRenewalRateTeamHistory(agentCode, month),
  ])
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

async function fetchExtraSalesCurrentMonth(agentCode: string, month: string): Promise<ExtraSalesMetrics> {
  const fullMetrics = await fetchExtraSalesFull(agentCode, month)

  return {
    ...emptyExtraSalesMetrics(),
    nsc_hp: fullMetrics.nsc_hp,
    net_afyp_hp: fullMetrics.net_afyp_hp,
    net_afyp_h: fullMetrics.net_afyp_h,
    net_case_h: fullMetrics.net_case_h,
    renewal_rate_team: fullMetrics.renewal_rate_team,
  }
}

function parseBooleanMetric(text: string) {
  return parseStoredMetric(text)
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
  const match = month.match(/^(\d{4})\/\d{2}$/)
  return match?.[1] ?? ""
}

function parseSalesMonthCsvRow(record: Record<string, string>): SalesMonthRow {
  const month = readCsvValue(record, "month")

  return {
    month,
    year: readCsvValue(record, "year") || inferYearFromMonth(month),
    agent_code: normalizeAgentCode(readCsvValue(record, "agent_code")),
    pinyin: readCsvValue(record, "pinyin"),
    net_afyp: parseStoredMetric(readCsvValue(record, "net_afyp")),
    net_afyp_assigned: parseStoredMetric(readCsvValue(record, "net_afyp_assigned")),
    net_case: parseStoredMetric(readCsvValue(record, "net_case")),
    net_case_assigned: parseStoredMetric(readCsvValue(record, "net_case_assigned")),
    nsc: parseStoredMetric(readCsvValue(record, "nsc")),
    is_qualified: parseBooleanMetric(readCsvValue(record, "is_qualified")),
    is_qualified_assigned: parseBooleanMetric(readCsvValue(record, "is_qualified_assigned")),
    net_afyp_sum: parseStoredMetric(readCsvValue(record, "net_afyp_sum")),
    net_afyp_assigned_sum: parseStoredMetric(readCsvValue(record, "net_afyp_assigned_sum")),
    net_case_sum: parseStoredMetric(readCsvValue(record, "net_case_sum")),
    net_case_assigned_sum: parseStoredMetric(readCsvValue(record, "net_case_assigned_sum")),
    nsc_sum: parseStoredMetric(readCsvValue(record, "nsc_sum")),
    net_afyc_sum: parseStoredMetric(readCsvValue(record, "net_afyc_sum")),
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

export function parseSalesMonthCsv(content: string) {
  return parseCsv(content)
    .map(parseSalesMonthCsvRow)
    .filter((row) => row.agent_code && row.year && row.month)
}

function resolveExtraSalesMetrics(
  sale: SalesData,
  cached: SalesMonthRow | undefined,
): { type: "reuse-full" | "reuse-sum-only" | "refresh"; metrics: ExtraSalesMetrics } {
  if (!cached) {
    return {
      type: "refresh",
      metrics: emptyExtraSalesMetrics(),
    }
  }

  if (!hasSameExtraSalesSnapshot(sale, cached)) {
    return {
      type: "refresh",
      metrics: emptyExtraSalesMetrics(),
    }
  }

  if (cached.month === sale.month) {
    return {
      type: "reuse-full",
      metrics: {
        nsc_hp: cached.nsc_hp,
        nsc_hp_sum: cached.nsc_hp_sum,
        net_afyp_hp: cached.net_afyp_hp,
        net_afyp_hp_sum: cached.net_afyp_hp_sum,
        net_afyp_h: cached.net_afyp_h,
        net_afyp_h_sum: cached.net_afyp_h_sum,
        net_case_h: cached.net_case_h,
        net_case_h_sum: cached.net_case_h_sum,
        renewal_rate_team: cached.renewal_rate_team,
      },
    }
  }

  if (canReusePreviousMonthExtraSales(sale, cached)) {
    return {
      type: "reuse-sum-only",
      metrics: {
        nsc_hp: 0,
        nsc_hp_sum: cached.nsc_hp_sum,
        net_afyp_hp: 0,
        net_afyp_hp_sum: cached.net_afyp_hp_sum,
        net_afyp_h: 0,
        net_afyp_h_sum: cached.net_afyp_h_sum,
        net_case_h: 0,
        net_case_h_sum: cached.net_case_h_sum,
        renewal_rate_team: cached.renewal_rate_team,
      },
    }
  }

  return {
    type: "refresh",
    metrics: emptyExtraSalesMetrics(),
  }
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
  const cacheMap = new Map(options?.cacheRows?.map((row) => [row.agent_code, row]) ?? [])
  const extraSalesRequestCache = new Map<string, ExtraSalesMetrics>()
  const salesDecisions = salesRows.map((sale) => ({
    sale,
    cached: cacheMap.get(sale.agent.agent_code),
    decision: resolveExtraSalesMetrics(sale, cacheMap.get(sale.agent.agent_code)),
  }))

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

  const totalExtraSalesRefreshCount = new Set(
    salesDecisions
      .filter(({ decision }) => decision.type === "refresh")
      .map(({ sale }) => sale.agent.agent_code),
  ).size
  const rows: SalesMonthRow[] = []
  const cache: SalesMonthCacheStats = {
    reusedFull: 0,
    reusedSumOnly: 0,
    refreshed: 0,
  }
  let completedExtraSalesRefreshCount = 0

  for (const { sale, decision } of salesDecisions) {
    let extraSalesMetrics = decision.metrics

    if (decision.type === "reuse-full") {
      cache.reusedFull += 1
    } else if (decision.type === "reuse-sum-only") {
      cache.reusedSumOnly += 1
    } else {
      if (extraSalesRequestCache.has(sale.agent.agent_code)) {
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
    }

    rows.push({
      ...sale,
      ...extraSalesMetrics,
      agent_code: sale.agent.agent_code,
      pinyin: sale.agent.pinyin,
    })
  }

  return {
    rows,
    cacheSourcePath: options?.cacheSourcePath ?? "",
    cache,
  }
}
