import { REQUEST_INTERVAL_MS, type AgentRow, type ProgressHandler } from "@/lib/pru/contract"
import {
  fetchAesHtml,
  normalizeAgentCode,
  parseHtml,
  sleep,
  textContent,
  unique,
} from "@/lib/pru/shared"

function valueFromLabel(cells: Element[], label: string) {
  const index = cells.findIndex((cell) => textContent(cell) === label)
  return index === -1 ? "" : textContent(cells[index + 1])
}

function parseDdMmYyyy(text: string) {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!match) {
    return ""
  }

  const [, day, month, year] = match
  return `${year}/${month}/${day}`
}

function getTableCellText(rows: Element[], rowIndex: number, cellIndex: number) {
  return textContent(rows[rowIndex]?.querySelectorAll("td")[cellIndex])
}

function extractSubordinateAgentCodes(html: string, agentCode: string) {
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

function parseAgentDetails(html: string, agentCode: string): AgentRow {
  const document = parseHtml(html)
  const tables = Array.from(document.querySelectorAll('form[name="frmAgtInfo"] table'))
  const basicRows = Array.from(tables[0]?.querySelectorAll("tr") ?? [])
  const extraCells = Array.from(tables[2]?.querySelectorAll("td") ?? [])
  const divisionText = getTableCellText(basicRows, 2, 1)
  const designationText = getTableCellText(basicRows, 5, 1)
  const leaderText = getTableCellText(basicRows, 6, 1)

  return {
    agent_code: agentCode,
    pinyin: getTableCellText(basicRows, 1, 1),
    designation: designationText.match(/\(([^)]+)\)/)?.[1] ?? "",
    leader_code: normalizeAgentCode(leaderText.split(" ")[0] ?? ""),
    join_date: parseDdMmYyyy(valueFromLabel(extraCells, "First FC Dt.")),
    financing_scheme: valueFromLabel(extraCells, "Financing Scheme"),
    financing_advance: valueFromLabel(extraCells, "Financing Advance"),
    agency: valueFromLabel(extraCells, "Agency Name"),
    division: divisionText.split(" ")[1] ?? "",
  }
}

async function getSubordinateAgentCodes(agentCode: string) {
  const html = await fetchAesHtml("getSubordinate", {
    agentCd: agentCode,
  })

  return extractSubordinateAgentCodes(html, agentCode)
}

async function getAgentDetails(agentCode: string) {
  const html = await fetchAesHtml("getAgentInfo", {
    agentCd: agentCode,
  })

  return parseAgentDetails(html, agentCode)
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
