import { and, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm'

import {
  appendAgentLogs,
  type AgentLogChange,
  type AppendAgentLogInput,
} from '../agent-log'
import { getDb, type DB, type DBExecutor } from '../context'
import { agentHierarchy, agents } from '../db/schema'

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
  agents: ImportedAgentInput[]
}

export interface ImportAgentsResult {
  importedCount: number
  createdCount: number
  updatedCount: number
  deletedCount: number
}

interface AgentHierarchySourceRow {
  agentCode: string
  leaderCode: string | null
  designation: number | null
}

interface AgentHierarchyRow {
  agentCode: string
  leaderCode: string
  hierarchy: number
}

interface AgentProfileState {
  agentCode: string
  name: string
  joinDate: string | null
  designation: number | null
  finacingScheme: string[] | null
  leaderCode: string | null
  lastPromotionDate: string | null
  agency: string | null
  division: string | null
  branch: string | null
  unit: string | null
}

interface PersistedAgentRecord extends AgentProfileState {
  id: number
  deletedAt: string | Date | null
}

interface ImportAgentsRuntime {
  listExistingAgents(agentCodes: string[]): Promise<PersistedAgentRecord[]>
  listActiveAgentCodes(): Promise<string[]>
  insertAgentBase(agent: AgentProfileState): Promise<void>
  updateAgentBaseById(id: number, agent: AgentProfileState): Promise<void>
  listCurrentAgents(agentCodes: string[]): Promise<Array<{
    id: number
    agentCode: string
    leaderCode: string | null
  }>>
  updateAgentLeaderById(id: number, leaderCode: string | null): Promise<void>
  softDeleteMissing(agentCodes: string[]): Promise<void>
  listHierarchySourceRows(): Promise<AgentHierarchySourceRow[]>
  replaceHierarchy(rows: AgentHierarchyRow[]): Promise<void>
  appendAgentLogs(logs: AppendAgentLogInput[]): Promise<void>
}

interface ImportAgentsDependencies {
  executeInTransaction<T>(work: (runtime: ImportAgentsRuntime) => Promise<T>): Promise<T>
}

const PROFILE_FIELDS = [
  'name',
  'joinDate',
  'designation',
  'finacingScheme',
  'leaderCode',
  'lastPromotionDate',
  'agency',
  'division',
  'branch',
  'unit',
] as const satisfies ReadonlyArray<keyof AgentProfileState>

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

function areFieldValuesEqual(
  left: AgentProfileState[keyof AgentProfileState] | null,
  right: AgentProfileState[keyof AgentProfileState] | null,
): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    return areStringArraysEqual(
      Array.isArray(left) ? left : null,
      Array.isArray(right) ? right : null,
    )
  }

  return left === right
}

function normalizeAgent(agent: ImportedAgentInput): AgentProfileState {
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

function buildAgentHierarchyRows(rows: AgentHierarchySourceRow[]): AgentHierarchyRow[] {
  const agentByCode = new Map(rows.map((row) => [row.agentCode, row]))
  const hierarchyRows: AgentHierarchyRow[] = []

  for (const agent of rows) {
    let currentAgent = agent
    let hierarchy = 1
    const visiting = new Set([agent.agentCode])

    while (currentAgent.leaderCode) {
      const leader = agentByCode.get(currentAgent.leaderCode)

      if (!leader) {
        throw new Error(`直属上级不存在: ${currentAgent.leaderCode}`)
      }

      if (visiting.has(leader.agentCode)) {
        throw new Error(`代理人层级存在循环: ${[...visiting, leader.agentCode].join(' -> ')}`)
      }

      hierarchyRows.push({
        agentCode: agent.agentCode,
        leaderCode: currentAgent.leaderCode,
        hierarchy,
      })

      visiting.add(leader.agentCode)
      currentAgent = leader

      if ((currentAgent.designation ?? 0) > 2) {
        hierarchy += 1
      }
    }
  }

  return hierarchyRows
}

function buildProfileChanges(
  before: AgentProfileState | null,
  after: AgentProfileState,
): AgentLogChange[] {
  return PROFILE_FIELDS.flatMap((field) => {
    const beforeValue = before?.[field] ?? null
    const afterValue = after[field] ?? null

    if (before && areFieldValuesEqual(beforeValue, afterValue)) {
      return []
    }

    return [{
      field,
      before: beforeValue,
      after: afterValue,
    }]
  })
}

function createImportAgentsRuntime(db: DBExecutor): ImportAgentsRuntime {
  return {
    async listExistingAgents(agentCodes) {
      const rows = await db
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
          deletedAt: agents.deletedAt,
        })
        .from(agents)
        .where(inArray(agents.agentCode, agentCodes))

      return rows.filter((row): row is typeof rows[number] & { agentCode: string } => !!row.agentCode)
    },
    async listActiveAgentCodes() {
      const rows = await db
        .select({
          agentCode: agents.agentCode,
        })
        .from(agents)
        .where(isNull(agents.deletedAt))

      return rows
        .map((row) => row.agentCode)
        .filter((agentCode): agentCode is string => !!agentCode)
    },
    async insertAgentBase(agent) {
      await db.insert(agents).values({
        agentCode: agent.agentCode,
        name: agent.name,
        joinDate: agent.joinDate,
        designation: agent.designation,
        finacingScheme: agent.finacingScheme,
        leaderCode: null,
        lastPromotionDate: agent.lastPromotionDate,
        agency: agent.agency,
        division: agent.division,
        branch: agent.branch,
        unit: agent.unit,
        deletedAt: null,
      })
    },
    async updateAgentBaseById(id, agent) {
      await db
        .update(agents)
        .set({
          name: agent.name,
          joinDate: agent.joinDate,
          designation: agent.designation,
          finacingScheme: agent.finacingScheme,
          lastPromotionDate: agent.lastPromotionDate,
          agency: agent.agency,
          division: agent.division,
          branch: agent.branch,
          unit: agent.unit,
          deletedAt: null,
        })
        .where(eq(agents.id, id))
    },
    async listCurrentAgents(agentCodes) {
      const rows = await db
        .select({
          id: agents.id,
          agentCode: agents.agentCode,
          leaderCode: agents.leaderCode,
        })
        .from(agents)
        .where(inArray(agents.agentCode, agentCodes))

      return rows.filter((row): row is typeof rows[number] & { agentCode: string } => !!row.agentCode)
    },
    async updateAgentLeaderById(id, leaderCode) {
      await db
        .update(agents)
        .set({
          leaderCode,
        })
        .where(eq(agents.id, id))
    },
    async softDeleteMissing(agentCodes) {
      await db
        .update(agents)
        .set({
          deletedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(and(
          isNull(agents.deletedAt),
          notInArray(agents.agentCode, agentCodes),
        ))
    },
    async listHierarchySourceRows() {
      const rows = await db
        .select({
          agentCode: agents.agentCode,
          leaderCode: agents.leaderCode,
          designation: agents.designation,
        })
        .from(agents)
        .where(isNull(agents.deletedAt))

      return rows.filter((row): row is typeof rows[number] & { agentCode: string } => !!row.agentCode)
    },
    async replaceHierarchy(rows) {
      await db.delete(agentHierarchy)

      if (rows.length > 0) {
        await db.insert(agentHierarchy).values(rows)
      }
    },
    appendAgentLogs(logs) {
      return appendAgentLogs(db, logs)
    },
  }
}

export class ImportAgentsCommand {
  private readonly input: ImportAgentsInput
  private readonly dependencies: ImportAgentsDependencies

  constructor(
    input: ImportAgentsInput,
    dependencies?: Partial<ImportAgentsDependencies>,
  ) {
    this.input = input
    const db = dependencies?.executeInTransaction ? null : getDb()
    this.dependencies = {
      executeInTransaction: dependencies?.executeInTransaction
        ?? ((work) => (db as DB).transaction((tx) => work(createImportAgentsRuntime(tx)))),
    }
  }

  async execute(): Promise<ImportAgentsResult> {
    const dedupedAgents = new Map<string, AgentProfileState>()

    for (const item of this.input.agents) {
      const normalized = normalizeAgent(item)
      dedupedAgents.set(normalized.agentCode, normalized)
    }

    if (dedupedAgents.size === 0) {
      throw new Error('没有可导入的代理人数据')
    }

    return this.dependencies.executeInTransaction(async (runtime) => {
      const importedAgents = [...dedupedAgents.values()]
      const importedCodes = importedAgents.map((agent) => agent.agentCode)
      const existingRows = await runtime.listExistingAgents(importedCodes)
      const activeAgentCodes = await runtime.listActiveAgentCodes()
      const existingByCode = new Map(existingRows.map((row) => [row.agentCode, row]))
      const updatedAgentCodes = new Set<string>()
      const importedCodeSet = new Set(importedCodes)
      const deletedAgentCodes = activeAgentCodes.filter((code) => !importedCodeSet.has(code))
      const logs: AppendAgentLogInput[] = []

      const missingLeaderCodes = [...new Set(
        importedAgents
          .map((agent) => agent.leaderCode)
          .filter((code): code is string => !!code && !importedCodeSet.has(code)),
      )]

      if (missingLeaderCodes.length > 0) {
        throw new Error(`直属上级不存在: ${missingLeaderCodes.join(', ')}`)
      }

      for (const agent of importedAgents) {
        const existing = existingByCode.get(agent.agentCode)

        if (!existing) {
          await runtime.insertAgentBase(agent)
          logs.push({
            agentCode: agent.agentCode,
            category: 'profile',
            action: 'created',
            source: 'ImportAgentsCommand',
            changes: buildProfileChanges(null, agent),
          })
          continue
        }

        const nextBaseState: AgentProfileState = {
          ...agent,
          leaderCode: existing.leaderCode,
        }
        const baseChanges = buildProfileChanges({
          ...existing,
        }, nextBaseState)

        if (baseChanges.length > 0 || existing.deletedAt !== null) {
          await runtime.updateAgentBaseById(existing.id, agent)
        }
      }

      const currentByCode = new Map(
        (await runtime.listCurrentAgents(importedCodes)).map((row) => [row.agentCode, row]),
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

        await runtime.updateAgentLeaderById(current.id, nextLeaderCode)
      }

      await runtime.softDeleteMissing(importedCodes)

      for (const agent of importedAgents) {
        const existing = existingByCode.get(agent.agentCode)

        if (!existing) {
          continue
        }

        const changes = buildProfileChanges(existing, agent)
        const restored = existing.deletedAt !== null

        if (restored) {
          logs.push({
            agentCode: agent.agentCode,
            category: 'profile',
            action: 'restored',
            source: 'ImportAgentsCommand',
            changes: [],
          })
        }

        if (changes.length > 0) {
          logs.push({
            agentCode: agent.agentCode,
            category: 'profile',
            action: 'updated',
            source: 'ImportAgentsCommand',
            changes,
          })
          updatedAgentCodes.add(agent.agentCode)
        }
      }

      for (const agentCode of deletedAgentCodes) {
        logs.push({
          agentCode,
          category: 'profile',
          action: 'deleted',
          source: 'ImportAgentsCommand',
          changes: [],
        })
      }

      const hierarchyRows = buildAgentHierarchyRows(await runtime.listHierarchySourceRows())
      await runtime.replaceHierarchy(hierarchyRows)
      await runtime.appendAgentLogs(logs)

      return {
        importedCount: dedupedAgents.size,
        createdCount: importedAgents.filter((agent) => !existingByCode.has(agent.agentCode)).length,
        updatedCount: updatedAgentCodes.size,
        deletedCount: deletedAgentCodes.length,
      }
    })
  }
}
