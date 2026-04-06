"use server"

import {
  BatchUpsertApmCommand,
  type BatchUpsertApmItem,
} from "@reeka-office/domain-performance"
import { revalidatePath } from "next/cache"

import { getRequiredAdminContext } from "@/lib/admin-context"
import { getFormDataValues } from "@/lib/form-data"

const importPerformanceFieldNames = ["file"] as const

const REQUIRED_HEADERS = [
  "month",
  "year",
  "agent_code",
  "pinyin",
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
] as const

type RequiredHeader = (typeof REQUIRED_HEADERS)[number]

type ImportApmActionResult =
  | {
      success: true
      processedCount: number
      createdCount: number
      updatedCount: number
    }
  | {
      error: string
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

function parseRequiredInteger(
  value: string,
  label: string,
  rowNumber: number,
): number {
  const text = value.trim()
  if (!/^-?\d+$/.test(text)) {
    throw new Error(`CSV 第 ${rowNumber} 行 ${label} 不是有效整数`)
  }

  return Number(text)
}

function parseRequiredMonth(
  monthValue: string,
  yearValue: string,
  rowNumber: number,
): { year: number; month: number } {
  const matched = monthValue.trim().match(/^(\d{4})\/(\d{2})$/)
  if (!matched) {
    throw new Error(`CSV 第 ${rowNumber} 行 month 格式无效，应为 YYYY/MM`)
  }

  const parsedYear = Number(matched[1])
  const parsedMonth = Number(matched[2])
  const year = parseRequiredInteger(yearValue, "year", rowNumber)

  if (parsedYear !== year) {
    throw new Error(`CSV 第 ${rowNumber} 行 month 与 year 不一致`)
  }

  if (parsedMonth < 1 || parsedMonth > 12) {
    throw new Error(`CSV 第 ${rowNumber} 行 month 无效`)
  }

  return {
    year,
    month: parsedMonth,
  }
}

function validateHeaders(headers: string[]) {
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header))

  if (missingHeaders.length > 0) {
    throw new Error(`CSV 缺少必需列: ${missingHeaders.join(", ")}`)
  }
}

function parseImportPayload(csvContent: string): BatchUpsertApmItem[] {
  const rows = parseCsvRows(csvContent)

  if (rows.length < 2) {
    throw new Error("CSV 文件没有可导入的数据")
  }

  const headers = rows[0].map(normalizeHeader)
  validateHeaders(headers)

  const parsedItems: BatchUpsertApmItem[] = []
  const seenKeys = new Set<string>()

  for (const [rowIndex, row] of rows.slice(1).entries()) {
    if (!row.some((cell) => cell.trim().length > 0)) {
      continue
    }

    const rowNumber = rowIndex + 2
    const record = Object.fromEntries(
      headers.map((header, index) => [header, row[index] ?? ""]),
    ) as Record<RequiredHeader, string>
    const agentCode = record.agent_code.trim()

    if (!agentCode) {
      throw new Error(`CSV 第 ${rowNumber} 行缺少 agent_code`)
    }

    const { year, month } = parseRequiredMonth(record.month, record.year, rowNumber)
    const item: BatchUpsertApmItem = {
      agentCode,
      year,
      month,
      netAfyp: parseRequiredInteger(record.net_afyp, "net_afyp", rowNumber),
      netAfypAssigned: parseRequiredInteger(record.net_afyp_assigned, "net_afyp_assigned", rowNumber),
      netCase: parseRequiredInteger(record.net_case, "net_case", rowNumber),
      netCaseAssigned: parseRequiredInteger(record.net_case_assigned, "net_case_assigned", rowNumber),
      nsc: parseRequiredInteger(record.nsc, "nsc", rowNumber),
      isQualified: parseRequiredInteger(record.is_qualified, "is_qualified", rowNumber),
      isQualifiedAssigned: parseRequiredInteger(record.is_qualified_assigned, "is_qualified_assigned", rowNumber),
      netAfypSum: parseRequiredInteger(record.net_afyp_sum, "net_afyp_sum", rowNumber),
      netAfypAssignedSum: parseRequiredInteger(record.net_afyp_assigned_sum, "net_afyp_assigned_sum", rowNumber),
      netCaseSum: parseRequiredInteger(record.net_case_sum, "net_case_sum", rowNumber),
      netCaseAssignedSum: parseRequiredInteger(record.net_case_assigned_sum, "net_case_assigned_sum", rowNumber),
      nscSum: parseRequiredInteger(record.nsc_sum, "nsc_sum", rowNumber),
      netAfycSum: parseRequiredInteger(record.net_afyc_sum, "net_afyc_sum", rowNumber),
      nscHp: parseRequiredInteger(record.nsc_hp, "nsc_hp", rowNumber),
      nscHpSum: parseRequiredInteger(record.nsc_hp_sum, "nsc_hp_sum", rowNumber),
      netAfypHp: parseRequiredInteger(record.net_afyp_hp, "net_afyp_hp", rowNumber),
      netAfypHpSum: parseRequiredInteger(record.net_afyp_hp_sum, "net_afyp_hp_sum", rowNumber),
      netAfypH: parseRequiredInteger(record.net_afyp_h, "net_afyp_h", rowNumber),
      netAfypHSum: parseRequiredInteger(record.net_afyp_h_sum, "net_afyp_h_sum", rowNumber),
      netCaseH: parseRequiredInteger(record.net_case_h, "net_case_h", rowNumber),
      netCaseHSum: parseRequiredInteger(record.net_case_h_sum, "net_case_h_sum", rowNumber),
      renewalRateTeam: parseRequiredInteger(record.renewal_rate_team, "renewal_rate_team", rowNumber),
    }
    const dedupeKey = `${item.agentCode}:${item.year}:${item.month}`

    if (seenKeys.has(dedupeKey)) {
      throw new Error(`CSV 中存在重复的代理人月份记录: ${item.agentCode} ${item.year}-${String(item.month).padStart(2, "0")}`)
    }

    seenKeys.add(dedupeKey)
    parsedItems.push(item)
  }

  if (parsedItems.length === 0) {
    throw new Error("CSV 中未解析到有效业绩数据")
  }

  return parsedItems
}

function getImportFiles(formData: FormData): File[] {
  return formData
    .getAll(importPerformanceFieldNames[0])
    .filter((value): value is File => value instanceof File && value.size > 0)
}

export async function importApmAction(
  formData: FormData,
): Promise<ImportApmActionResult> {
  try {
    await getRequiredAdminContext()

    const fields = getFormDataValues(formData, importPerformanceFieldNames)
    const files = getImportFiles(formData)

    if (!(fields.file instanceof File) || files.length === 0) {
      return {
        error: "请选择至少一个要导入的 CSV 文件",
      }
    }

    const invalidFile = files.find((file) => !file.name.toLowerCase().endsWith(".csv"))

    if (invalidFile) {
      return {
        error: `仅支持导入 CSV 文件：${invalidFile.name}`,
      }
    }

    const items = (
      await Promise.all(files.map(async (file) => parseImportPayload(await file.text())))
    ).flat()

    const result = await new BatchUpsertApmCommand({
      items,
    }).execute()

    revalidatePath("/pru/performance")

    return {
      success: true,
      ...result,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "导入业绩数据失败",
    }
  }
}
