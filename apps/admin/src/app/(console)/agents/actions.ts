"use server"

import {
  getDesignationValue,
  ImportAgentsCommand,
  ListAgentsQuery,
  type ImportedAgentInput,
} from "@reeka-office/domain-agent"
import {
  CreateBindingTokenCommand,
  ListActiveBindingTokensQuery,
  ListActiveTenantAgentBindingsQuery,
} from "@reeka-office/domain-identity"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getRequiredAdminContext } from "@/lib/admin-context"
import { getFormDataValues } from "@/lib/form-data"
import { adminActionClient } from "@/lib/safe-action"

const importAgentFieldNames = ["file"] as const
const defaultBindingTokenExpiresInHours = 24 * 7

type ImportAgentsActionResult =
  | {
    success: true
    importedCount: number
    createdCount: number
    updatedCount: number
    deletedCount: number
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

function normalizeDesignation(value: unknown): number | null {
  const designation = normalizeInt(value)
  if (designation !== null) {
    return designation
  }

  const text = normalizeText(value)
  if (!text) {
    return null
  }

  const designationValue = getDesignationValue(text)
  if (designationValue === null) {
    throw new Error(`代理人职级无效: ${text}`)
  }

  return designationValue
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
    "pinyin",
  ])

  if (!agentCode || !name) {
    return null
  }

  const joinDate = normalizeDate(
    value.join_date
  )

  const designation = normalizeDesignation(value.designation ?? value.designation_name)

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

const createScopedBindingTokensSchema = z.object({
  mode: z.enum(["division", "designation"]),
  division: z.string().trim().optional(),
  designations: z.array(z.number().int().min(0)).default([]),
  expiresInHours: z.number().int().min(1).max(24 * 30).default(defaultBindingTokenExpiresInHours),
}).superRefine((value, ctx) => {
  if (value.mode === "division" && !value.division) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["division"],
      message: "请选择 division",
    })
  }

  if (value.mode === "designation" && value.designations.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["designations"],
      message: "请至少选择一个职级",
    })
  }
})

export const createScopedBindingTokensAction = adminActionClient
  .inputSchema(createScopedBindingTokensSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { tenantCode } = ctx.admin
    const designations = [...new Set(parsedInput.designations)].sort((left, right) => left - right)
    const division = parsedInput.mode === "division"
      ? parsedInput.division?.trim() ?? ""
      : null

    const agents = await new ListAgentsQuery({
      division,
      sort: "designation_desc",
    }).query()
    const scopedAgents = agents.filter((agent) => {
      if (agent.designation == null) {
        return false
      }

      if (parsedInput.mode === "division") {
        return true
      }

      return designations.includes(agent.designation)
    })

    const [activeBindings, activeTokens] = await Promise.all([
      new ListActiveTenantAgentBindingsQuery({
        tenantCode,
        agentIds: scopedAgents.map((agent) => agent.id),
      }).query(),
      new ListActiveBindingTokensQuery({
        tenantCode,
        agentIds: scopedAgents.map((agent) => agent.id),
      }).query(),
    ])

    const activeBindingByAgentId = new Map(
      activeBindings.map((binding) => [binding.agentId, binding]),
    )
    const activeTokenByAgentId = new Map<number, (typeof activeTokens)[number]>()

    for (const token of activeTokens) {
      const current = activeTokenByAgentId.get(token.agentId)

      if (!current || token.expiresAt.getTime() > current.expiresAt.getTime()) {
        activeTokenByAgentId.set(token.agentId, token)
      }
    }
    const skippedExistingTokenCount = scopedAgents.filter((agent) =>
      !activeBindingByAgentId.has(agent.id)
      && activeTokenByAgentId.has(agent.id),
    ).length

    const eligibleAgents = scopedAgents.filter((agent) =>
      !activeBindingByAgentId.has(agent.id)
      && !activeTokenByAgentId.has(agent.id),
    )
    const expiresAt = new Date(Date.now() + parsedInput.expiresInHours * 60 * 60 * 1000)
    const generated: Array<{
      agentId: number
      name: string
      agentCode: string | null
      division: string | null
      designation: number | null
      token: string
      expiresAt: string
    }> = []

    for (const agent of eligibleAgents) {
      const result = await new CreateBindingTokenCommand({
        tenantCode,
        agentId: agent.id,
        expiresAt,
      }).execute()

      generated.push({
        agentId: agent.id,
        name: agent.name,
        agentCode: agent.agentCode,
        division: agent.division,
        designation: agent.designation,
        token: result.token,
        expiresAt: result.expiresAt.toISOString(),
      })
    }

    const tokens = scopedAgents
      .filter((agent) => !activeBindingByAgentId.has(agent.id))
      .map((agent) => {
        const generatedToken = generated.find((item) => item.agentId === agent.id)
        if (generatedToken) {
          return generatedToken
        }

        const existingToken = activeTokenByAgentId.get(agent.id)
        if (!existingToken) {
          return null
        }

        return {
          agentId: agent.id,
          name: agent.name,
          agentCode: agent.agentCode,
          division: agent.division,
          designation: agent.designation,
          token: existingToken.token,
          expiresAt: existingToken.expiresAt.toISOString(),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item != null)

    revalidatePath("/agents")

    return {
      mode: parsedInput.mode,
      division,
      designations,
      generatedCount: generated.length,
      tokens,
      totalCount: scopedAgents.length,
      skippedActivatedCount: activeBindingByAgentId.size,
      skippedExistingTokenCount,
    }
  })
