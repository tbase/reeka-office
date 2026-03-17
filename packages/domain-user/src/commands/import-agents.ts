import { and, eq, inArray } from 'drizzle-orm'
import { getDb, type DB } from '../context'
import { agents } from '../db/schema'

export interface ImportedAgentInput {
  agentCode: string
  name: string
  joinDate: string | null
  designation?: number | null
  finacingScheme?: string[] | null
  leaderCode?: string | null
  lastPromotionDate?: string | null
  agency?: string | null
  division?: string | null
  branch?: string | null
  unit?: string | null
}

export interface ImportAgentsInput {
  tenantId: number
  agents: ImportedAgentInput[]
}

export interface ImportAgentsResult {
  importedCount: number
  createdCount: number
  updatedCount: number
}

function normalizeText(value: string | null | undefined): string | null {
  const text = value?.trim()
  return text ? text : null
}

function normalizeNullableInt(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null
  }

  return Number.isInteger(value) ? value : null
}

function normalizeStringArray(value: string[] | null | undefined): string[] | null {
  if (!value) {
    return null
  }

  const items = value
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  return items.length > 0 ? items : null
}

function areStringArraysEqual(
  left: string[] | null | undefined,
  right: string[] | null | undefined,
): boolean {
  if (!left && !right) {
    return true
  }

  if (!left || !right || left.length !== right.length) {
    return false
  }

  return left.every((item, index) => item === right[index])
}

function normalizeAgent(agent: ImportedAgentInput): ImportedAgentInput {
  const agentCode = agent.agentCode.trim()
  const name = agent.name.trim()
  const joinDate = normalizeText(agent.joinDate)
  const designation = normalizeNullableInt(agent.designation)
  const finacingScheme = normalizeStringArray(agent.finacingScheme)
  const leaderCode = normalizeText(agent.leaderCode)
  const lastPromotionDate = normalizeText(agent.lastPromotionDate)
  const agency = normalizeText(agent.agency)
  const division = normalizeText(agent.division)
  const branch = normalizeText(agent.branch)
  const unit = normalizeText(agent.unit)

  if (!agentCode) {
    throw new Error('代理人编码不能为空')
  }

  if (agentCode.length > 8) {
    throw new Error(`代理人编码过长: ${agentCode}`)
  }

  if (!name) {
    throw new Error(`代理人姓名不能为空: ${agentCode}`)
  }

  if (name.length > 100) {
    throw new Error(`代理人姓名过长: ${agentCode}`)
  }

  if (agent.designation !== undefined && agent.designation !== null && designation === null) {
    throw new Error(`代理人职级必须为整数: ${agentCode}`)
  }

  if (joinDate && !/^\d{4}-\d{2}-\d{2}$/.test(joinDate)) {
    throw new Error(`代理人加入时间格式无效: ${agentCode}`)
  }

  if (leaderCode && leaderCode.length > 8) {
    throw new Error(`直属上级编码过长: ${agentCode}`)
  }

  if (lastPromotionDate && !/^\d{4}-\d{2}-\d{2}$/.test(lastPromotionDate)) {
    throw new Error(`最近晋升时间格式无效: ${agentCode}`)
  }

  for (const [label, value] of [
    ['代理人机构', agency],
    ['代理人分区', division],
    ['代理人分部', branch],
    ['代理人单元', unit],
  ] as const) {
    if (value && value.length > 100) {
      throw new Error(`${label}过长: ${agentCode}`)
    }
  }

  return {
    agentCode,
    name,
    joinDate,
    designation,
    finacingScheme,
    leaderCode,
    lastPromotionDate,
    agency,
    division,
    branch,
    unit,
  }
}

export class ImportAgentsCommand {
  private readonly db: DB
  private readonly input: ImportAgentsInput

  constructor(input: ImportAgentsInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<ImportAgentsResult> {
    const dedupedAgents = new Map<string, ImportedAgentInput>()

    for (const item of this.input.agents) {
      const normalized = normalizeAgent(item)
      dedupedAgents.set(normalized.agentCode, normalized)
    }

    if (dedupedAgents.size === 0) {
      throw new Error('没有可导入的代理人数据')
    }

    return this.db.transaction(async (tx) => {
      const importedAgents = [...dedupedAgents.values()]
      const importedCodes = importedAgents.map((agent) => agent.agentCode)
      const existingRows = await tx
        .select({
          id: agents.id,
          agentCode: agents.agentCode,
          name: agents.name,
          joinDate: agents.joinDate,
          designation: agents.designation,
          finacingScheme: agents.finacingScheme,
          leaderCode: agents.leaderCode,
          lastPromotionDate: agents.lastPromotionDate,
          agency: agents.agency,
          division: agents.division,
          branch: agents.branch,
          unit: agents.unit,
        })
        .from(agents)
        .where(and(
          eq(agents.tenantId, this.input.tenantId),
          inArray(agents.agentCode, importedCodes),
        ))

      const existingByCode = new Map(
        existingRows
          .filter((row): row is typeof existingRows[number] & { agentCode: string } => !!row.agentCode)
          .map((row) => [row.agentCode, row]),
      )
      const updatedAgentCodes = new Set<string>()
      let createdCount = 0
      const knownAgentCodes = new Set([
        ...importedCodes,
        ...existingRows
          .map((row) => row.agentCode)
          .filter((code): code is string => !!code),
      ])

      const missingLeaderCodes = [...new Set(
        importedAgents
          .map((agent) => agent.leaderCode)
          .filter((code): code is string => !!code && !knownAgentCodes.has(code)),
      )]

      if (missingLeaderCodes.length > 0) {
        throw new Error(`直属上级不存在: ${missingLeaderCodes.join(', ')}`)
      }

      for (const agent of importedAgents) {
        const existing = existingByCode.get(agent.agentCode)

        if (!existing) {
          await tx.insert(agents).values({
            tenantId: this.input.tenantId,
            agentCode: agent.agentCode,
            name: agent.name,
            joinDate: agent.joinDate,
            designation: agent.designation ?? null,
            finacingScheme: agent.finacingScheme ?? null,
            leaderCode: null,
            lastPromotionDate: agent.lastPromotionDate ?? null,
            agency: agent.agency ?? null,
            division: agent.division ?? null,
            branch: agent.branch ?? null,
            unit: agent.unit ?? null,
          })
          createdCount += 1
          continue
        }

        const nextJoinDate = agent.joinDate
        const nextDesignation = agent.designation ?? null
        const nextFinacingScheme = agent.finacingScheme ?? null
        const nextLastPromotionDate = agent.lastPromotionDate ?? null
        const nextAgency = agent.agency ?? null
        const nextDivision = agent.division ?? null
        const nextBranch = agent.branch ?? null
        const nextUnit = agent.unit ?? null
        const hasChanges =
          existing.name !== agent.name
          || existing.joinDate !== nextJoinDate
          || existing.designation !== nextDesignation
          || !areStringArraysEqual(existing.finacingScheme, nextFinacingScheme)
          || existing.lastPromotionDate !== nextLastPromotionDate
          || existing.agency !== nextAgency
          || existing.division !== nextDivision
          || existing.branch !== nextBranch
          || existing.unit !== nextUnit

        if (!hasChanges) {
          continue
        }

        await tx
          .update(agents)
          .set({
            name: agent.name,
            joinDate: nextJoinDate,
            designation: nextDesignation,
            finacingScheme: nextFinacingScheme,
            lastPromotionDate: nextLastPromotionDate,
            agency: nextAgency,
            division: nextDivision,
            branch: nextBranch,
            unit: nextUnit,
          })
          .where(eq(agents.id, existing.id))

        updatedAgentCodes.add(agent.agentCode)
      }

      const currentRows = await tx
        .select({
          id: agents.id,
          agentCode: agents.agentCode,
          leaderCode: agents.leaderCode,
        })
        .from(agents)
        .where(and(
          eq(agents.tenantId, this.input.tenantId),
          inArray(agents.agentCode, importedCodes),
        ))

      const currentByCode = new Map(
        currentRows
          .filter((row): row is typeof currentRows[number] & { agentCode: string } => !!row.agentCode)
          .map((row) => [row.agentCode, row]),
      )

      for (const agent of importedAgents) {
        const current = currentByCode.get(agent.agentCode)
        if (!current) {
          continue
        }

        const nextLeaderCode = agent.leaderCode ?? null
        if (current.leaderCode === nextLeaderCode) {
          continue
        }

        await tx
          .update(agents)
          .set({
            leaderCode: nextLeaderCode,
          })
          .where(eq(agents.id, current.id))

        if (existingByCode.has(agent.agentCode)) {
          updatedAgentCodes.add(agent.agentCode)
        }
      }

      return {
        importedCount: dedupedAgents.size,
        createdCount,
        updatedCount: updatedAgentCodes.size,
      }
    })
  }
}
