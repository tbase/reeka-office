"use server"

import { ImportAgentsCommand, type ImportedAgentInput } from "@reeka-office/domain-user"
import { revalidatePath } from "next/cache"

import { getRequiredAdminContext } from "@/lib/admin-context"
import { getFormDataValues } from "@/lib/form-data"

const importAgentFieldNames = ["file"] as const

type ImportAgentsActionResult =
  | {
    success: true
    importedCount: number
    createdCount: number
    updatedCount: number
  }
  | {
    error: string
  }

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const text = value.trim()
  return text ? text : null
}

function normalizeDate(value: unknown): string | null {
  if (typeof value === "string") {
    const text = value.trim()
    const matched = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (matched) {
      const [, year, month, day] = matched
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }

    const parsed = new Date(text)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value < 1_000_000_000_000 ? value * 1000 : value
    const parsed = new Date(timestamp)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
  }

  return null
}

function normalizeStringArray(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0)

    return items.length > 0 ? items : null
  }

  if (typeof value !== "string") {
    return null
  }

  const text = value.trim()
  if (!text) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return normalizeStringArray(parsed)
    }
  } catch {
    return text
      .split(/[,\n，、]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  return null
}

function normalizeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value
  }

  if (typeof value !== "string") {
    return null
  }

  const text = value.trim()
  if (!text) {
    return null
  }

  if (!/^-?\d+$/.test(text)) {
    return null
  }

  return Number(text)
}

function pickFirstText(
  source: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = normalizeText(source[key])
    if (value) {
      return value
    }
  }

  return null
}

function parseAgentRecord(value: unknown): ImportedAgentInput | null {
  if (!isRecord(value)) {
    return null
  }

  const agentCode = pickFirstText(value, [
    "agent_code",
  ])
  const name = pickFirstText(value, [
    "name",
  ])

  if (!agentCode || !name) {
    return null
  }

  const joinDate = normalizeDate(
    value.join_date
  )

  const designation = normalizeInt(value.designation)

  return {
    agentCode,
    name,
    joinDate,
    designation,
    finacingScheme: normalizeStringArray(value.finacing_scheme),
    leaderCode: pickFirstText(value, [
      "leader_code",
    ]),
    lastPromotionDate: normalizeDate(
      value.last_promotion_date
    ),
    agency: pickFirstText(value, ["agency"]),
    division: pickFirstText(value, ["division"]),
    branch: pickFirstText(value, ["branch"]),
    unit: pickFirstText(value, ["unit"]),
  }
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase()
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]

    if (inQuotes) {
      if (char === "\"") {
        if (content[index + 1] === "\"") {
          cell += "\""
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }

      continue
    }

    if (char === "\"") {
      inQuotes = true
      continue
    }

    if (char === ",") {
      row.push(cell)
      cell = ""
      continue
    }

    if (char === "\r" || char === "\n") {
      if (char === "\r" && content[index + 1] === "\n") {
        index += 1
      }

      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
      continue
    }

    cell += char
  }

  if (inQuotes) {
    throw new Error("CSV 格式无效：引号未闭合")
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((currentRow) =>
    currentRow.some((currentCell) => currentCell.trim().length > 0),
  )
}

function parseImportPayload(csvContent: string): ImportedAgentInput[] {
  const rows = parseCsvRows(csvContent)
  if (rows.length < 2) {
    throw new Error("CSV 文件没有可导入的数据")
  }

  const headers = rows[0].map(normalizeHeader)
  const parsedItems: ImportedAgentInput[] = []

  for (const [rowIndex, row] of rows.slice(1).entries()) {
    if (!row.some((cell) => cell.trim().length > 0)) {
      continue
    }

    const record = Object.fromEntries(
      headers.map((header, index) => [header, row[index] ?? ""]),
    )
    const parsed = parseAgentRecord(record)

    if (!parsed) {
      console.error(`CSV 第 ${rowIndex + 2} 行缺少代理人编码、姓名或加入时间`, record)
      throw new Error(`CSV 第 ${rowIndex + 2} 行缺少代理人编码、姓名或加入时间`)
    }

    parsedItems.push(parsed)
  }

  if (parsedItems.length === 0) {
    throw new Error("CSV 中未解析到有效代理人数据")
  }

  return parsedItems
}

export async function importAgentsAction(
  formData: FormData,
): Promise<ImportAgentsActionResult> {
  try {
    await getRequiredAdminContext()
    const fields = getFormDataValues(formData, importAgentFieldNames)
    const file = fields.file

    if (!(file instanceof File) || file.size === 0) {
      return {
        error: "请选择要导入的 CSV 文件",
      }
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return {
        error: "仅支持导入 CSV 文件",
      }
    }

    const result = await new ImportAgentsCommand({
      agents: parseImportPayload(await file.text()),
    }).execute()

    revalidatePath("/agents")
    revalidatePath("/points/agents")

    return {
      success: true,
      ...result,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "导入代理人失败",
    }
  }
}
