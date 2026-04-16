import { parseCsv } from "@/lib/csv"
import { REQUEST_INTERVAL_MS, type AgentRow, type ProgressHandler } from "@/lib/pru/contract"
import {
  fetchAesHtml,
  getTableRowCells,
  normalizeAgentCode,
  parseHtml,
  parseLinesFromHtml,
  readCsvValue,
  sleep,
  textContent,
  unique,
} from "@/lib/pru/shared"

type BaseAgentRow = Omit<AgentRow, "leader_code">

type AgentDetailRow = Pick<
  AgentRow,
  "pinyin" | "designation" | "leader_code" | "join_date" | "agency" | "division" | "branch" | "unit"
>

type FetchAgentsOptions = {
  onProgress?: ProgressHandler;
  cacheRows?: AgentRow[];
};

type LeaderIntegrityIssue = {
  agent_code: string
  leader_code: string
}

function parseDdMmYyyy(text: string) {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!match) {
    return ""
  }

  const [, day, month, year] = match
  return `${year}/${month}/${day}`
}

function parseDesignation(text: string) {
  return text.match(/\(([^)]+)\)/)?.[1]?.trim() ?? ""
}

function parseOrganizationText(text: string) {
  const parts = text
    .trim()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    division: parts[1] ?? "",
    branch: parts[2] ?? "",
    unit: parts[3] ?? "",
  }
}

function getTableCellText(row: Element, cellIndex: number) {
  return textContent(getTableRowCells(row)[cellIndex])
}

function getTableCellHtml(row: Element, cellIndex: number) {
  return getTableRowCells(row)[cellIndex]?.innerHTML ?? ""
}

function getAgentCodeFromRow(row: Element) {
  const link = row.querySelector('a[href*="purpose=getAgentInfo&agentCd="]')

  if (!link) {
    return ""
  }

  const href = link.getAttribute("href") ?? ""
  const hrefCode = href.split("&agentCd=")[1] ?? ""
  return normalizeAgentCode(hrefCode || textContent(link))
}

function findSubordinateRows(document: Document) {
  const headerRow = Array.from(document.querySelectorAll("table tr.header")).find((row) =>
    Array.from(row.querySelectorAll("th")).some((cell) => textContent(cell) === "Agent Name"),
  )

  if (!headerRow || !headerRow.parentElement) {
    return []
  }

  const rows = Array.from(headerRow.parentElement.children)
  const headerIndex = rows.indexOf(headerRow)

  if (headerIndex === -1) {
    return []
  }

  return rows
    .slice(headerIndex + 1)
    .filter((row): row is HTMLTableRowElement => row instanceof HTMLTableRowElement)
    .filter((row) => row.querySelectorAll("td").length > 0)
}

function extractSubordinateAgents(html: string) {
  const document = parseHtml(html)
  const rows = findSubordinateRows(document)

  return rows.reduce<BaseAgentRow[]>((agents, row, index) => {
    const organizationLines = parseLinesFromHtml(getTableCellHtml(row, 4))
    const [division = "", branch = "", unit = "", rawAgentCode = ""] = organizationLines
    const agent_code = normalizeAgentCode(rawAgentCode) || getAgentCodeFromRow(row)

    if (!agent_code) {
      console.info("[agents] skip row without agent code", { index, organizationLines })
      return agents
    }

    agents.push({
      agent_code,
      pinyin: getTableCellText(row, 5),
      email: getTableCellText(row, 11),
      designation: parseDesignation(getTableCellText(row, 6)),
      join_date: parseDdMmYyyy(getTableCellText(row, 7)),
      agency: getTableCellText(row, 3),
      division,
      branch,
      unit,
    })

    return agents
  }, [])
}

function valueFromLabel(cells: Element[], label: string) {
  const index = cells.findIndex((cell) => textContent(cell) === label)
  return index === -1 ? "" : textContent(cells[index + 1])
}

function parseAgentDetails(html: string): AgentDetailRow {
  const document = parseHtml(html)
  const tables = Array.from(document.querySelectorAll('form[name="frmAgtInfo"] table'))
  const basicRows = Array.from(tables[0]?.querySelectorAll("tr") ?? [])
  const extraCells = Array.from(tables[2]?.querySelectorAll("td") ?? [])
  const organization = parseOrganizationText(getTableCellText(basicRows[2] ?? document.body, 1))
  const leaderText = getTableCellText(basicRows[6] ?? document.body, 1)

  return {
    pinyin: getTableCellText(basicRows[1] ?? document.body, 1),
    designation: parseDesignation(getTableCellText(basicRows[5] ?? document.body, 1)),
    leader_code: normalizeAgentCode(leaderText.split(" ")[0] ?? ""),
    join_date: parseDdMmYyyy(valueFromLabel(extraCells, "First FC Dt.")),
    agency: valueFromLabel(extraCells, "Agency Name"),
    division: organization.division,
    branch: organization.branch,
    unit: organization.unit,
  }
}

function mergeAgentRows(agentCode: string, base: BaseAgentRow | undefined, detail: AgentDetailRow): AgentRow {
  return {
    agent_code: agentCode,
    pinyin: base?.pinyin || detail.pinyin,
    email: base?.email ?? "",
    leader_code: detail.leader_code,
    join_date: base?.join_date || detail.join_date,
    designation: base?.designation || detail.designation,
    agency: base?.agency || detail.agency,
    division: base?.division || detail.division,
    branch: base?.branch || detail.branch,
    unit: base?.unit || detail.unit,
  }
}

function mergeBatchWithCache(base: BaseAgentRow, cached: AgentRow | undefined): BaseAgentRow {
  return {
    agent_code: base.agent_code,
    pinyin: base.pinyin || cached?.pinyin || "",
    email: base.email || cached?.email || "",
    designation: base.designation || cached?.designation || "",
    join_date: base.join_date || cached?.join_date || "",
    agency: base.agency || cached?.agency || "",
    division: base.division || cached?.division || "",
    branch: base.branch || cached?.branch || "",
    unit: base.unit || cached?.unit || "",
  };
}

function toBaseAgentRow(row: AgentRow): BaseAgentRow {
  return {
    agent_code: row.agent_code,
    pinyin: row.pinyin,
    email: row.email,
    designation: row.designation,
    join_date: row.join_date,
    agency: row.agency,
    division: row.division,
    branch: row.branch,
    unit: row.unit,
  }
}

function clearRootLeaderCode(rowsByCode: Map<string, AgentRow>, rootAgentCode: string) {
  const rootRow = rowsByCode.get(rootAgentCode)

  if (!rootRow || !rootRow.leader_code) {
    return
  }

  rowsByCode.set(rootAgentCode, {
    ...rootRow,
    leader_code: "",
  })
}

function buildOrderedAgentRows(agentCodes: string[], rowsByCode: Map<string, AgentRow>) {
  return agentCodes.flatMap((code) => {
    const row = rowsByCode.get(code)
    return row ? [row] : []
  })
}

function findLeaderIntegrityIssues(rows: AgentRow[], rootAgentCode: string): LeaderIntegrityIssue[] {
  const agentCodes = new Set(rows.map((row) => row.agent_code))

  return rows.reduce<LeaderIntegrityIssue[]>((issues, row) => {
    if (row.agent_code === rootAgentCode) {
      return issues
    }

    if (!row.leader_code || !agentCodes.has(row.leader_code)) {
      issues.push({
        agent_code: row.agent_code,
        leader_code: row.leader_code,
      })
    }

    return issues
  }, [])
}

function formatLeaderIntegrityIssue(issue: LeaderIntegrityIssue) {
  return `${issue.agent_code} -> ${issue.leader_code || "空"}`
}

async function refreshRowsWithInvalidLeaders(
  rowsByCode: Map<string, AgentRow>,
  agentCodes: string[],
  rootAgentCode: string,
  onProgress: ProgressHandler | undefined,
) {
  clearRootLeaderCode(rowsByCode, rootAgentCode)

  const issues = findLeaderIntegrityIssues(buildOrderedAgentRows(agentCodes, rowsByCode), rootAgentCode)

  if (issues.length === 0) {
    return
  }

  for (const [index, issue] of issues.entries()) {
    const row = rowsByCode.get(issue.agent_code)

    if (!row) {
      continue
    }

    onProgress?.(`重拉上级异常成员 ${index + 1}/${issues.length}: ${issue.agent_code}`)
    const detail = await getAgentDetails(issue.agent_code)

    rowsByCode.set(issue.agent_code, mergeAgentRows(issue.agent_code, toBaseAgentRow(row), detail))

    if (index < issues.length - 1) {
      await sleep(REQUEST_INTERVAL_MS)
    }
  }

  clearRootLeaderCode(rowsByCode, rootAgentCode)

  const unresolvedIssues = findLeaderIntegrityIssues(buildOrderedAgentRows(agentCodes, rowsByCode), rootAgentCode)

  if (unresolvedIssues.length > 0) {
    throw new Error(`代理人直属上级不存在，已重拉仍无法修正: ${unresolvedIssues.map(formatLeaderIntegrityIssue).join(", ")}`)
  }
}

async function getSubordinateAgents(agentCode: string) {
  const html = await fetchAesHtml("getSubordinate", {
    agentCd: agentCode,
  })

  return extractSubordinateAgents(html)
}

async function getAgentDetails(agentCode: string) {
  const html = await fetchAesHtml("getAgentInfo", {
    agentCd: agentCode,
  })

  return parseAgentDetails(html)
}

function parseAgentsCsvRow(record: Record<string, string>): AgentRow {
  return {
    agent_code: normalizeAgentCode(readCsvValue(record, "agent_code", "AGENT_CODE")),
    pinyin: readCsvValue(record, "pinyin", "name", "PINYIN", "NAME"),
    email: readCsvValue(record, "email", "EMAIL"),
    leader_code: normalizeAgentCode(readCsvValue(record, "leader_code", "LEADER_CODE")),
    join_date: readCsvValue(record, "join_date", "JOIN_DATE"),
    designation: readCsvValue(record, "designation", "DESIGNATION"),
    agency: readCsvValue(record, "agency", "AGENCY"),
    division: readCsvValue(record, "division", "DIVISION"),
    branch: readCsvValue(record, "branch", "BRANCH"),
    unit: readCsvValue(record, "unit", "UNIT"),
  }
}

export function parseAgentsCsv(content: string) {
  return parseCsv(content)
    .map(parseAgentsCsvRow)
    .filter((row) => row.agent_code)
}

export async function fetchAgents(agentCode: string, options?: FetchAgentsOptions) {
  const onProgress = options?.onProgress;
  const rootAgentCode = normalizeAgentCode(agentCode) || agentCode.trim();

  onProgress?.("读取成员列表...");
  const subordinateAgents = await getSubordinateAgents(rootAgentCode);
  const cacheMap = new Map((options?.cacheRows ?? []).map((row) => [row.agent_code, row]));
  const rowsByCode = new Map<string, AgentRow>();
  const detailTargets: Array<{ agent_code: string; base?: BaseAgentRow }> = [];

  for (const base of subordinateAgents) {
    const cached = cacheMap.get(base.agent_code);
    const mergedBase = mergeBatchWithCache(base, cached);

    if (cached?.leader_code) {
      rowsByCode.set(base.agent_code, {
        ...mergedBase,
        leader_code: cached.leader_code,
      });
      continue;
    }

    detailTargets.push({
      agent_code: base.agent_code,
      base: mergedBase,
    });
  }

  const cachedRoot = cacheMap.get(rootAgentCode);

  if (cachedRoot) {
    rowsByCode.set(rootAgentCode, cachedRoot);
  } else if (rootAgentCode) {
    detailTargets.unshift({ agent_code: rootAgentCode });
  }

  if (detailTargets.length > 0) {
    onProgress?.("比对本地缓存...");
  }

  for (const [index, target] of detailTargets.entries()) {
    onProgress?.(`补充成员详情 ${index + 1}/${detailTargets.length}: ${target.agent_code}`);
    const detail = await getAgentDetails(target.agent_code);
    rowsByCode.set(
      target.agent_code,
      mergeAgentRows(target.agent_code, target.base, detail),
    );

    if (index < detailTargets.length - 1) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  if (detailTargets.length === 0) {
    onProgress?.("已复用本地缓存，无需补充详情");
  }

  const agentCodes = unique([
    rootAgentCode,
    ...subordinateAgents.map((row) => row.agent_code),
  ])

  await refreshRowsWithInvalidLeaders(rowsByCode, agentCodes, rootAgentCode, onProgress)

  return buildOrderedAgentRows(agentCodes, rowsByCode)
}
