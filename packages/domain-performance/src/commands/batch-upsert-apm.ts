import { agentHierarchy, agents } from '@reeka-office/domain-agent'
import { and, eq, gte, inArray, lte, or, sql, sum } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import {
  apm,
  type NewApmRow,
} from '../schema'

const QUALIFICATION_CONFIG = {
  newAgentMonthlyTarget: 2000000,
  seniorQuarterlyTargets: [5000000, 12000000, 20000000, 28000000],
} as const

const RM_DESIGNATION = 5
const SENIOR_TEAM_NSC_TARGETS = [1950000, 2900000, 3900000, 3900000] as const

type Period = {
  year: number
  month: number
}

type AgentQualificationProfile = {
  agentCode: string
  joinDate: string | null
  designation: number | null
}

type QualificationResult = {
  isQualified: boolean
  qualifiedGap: number
}

export interface BatchUpsertApmItem {
  agentCode: string
  year: number
  month: number
  nsc: number
  nscSum: number
  netAfycSum: number
  netAfyp: number
  netAfypSum: number
  netAfypAssigned: number
  netAfypAssignedSum: number
  nscHp: number
  nscHpSum: number
  netAfypHp: number
  netAfypHpSum: number
  netAfypH: number
  netAfypHSum: number
  netCaseH: number
  netCaseHSum: number
  netCase: number
  netCaseSum: number
  netCaseAssigned: number
  netCaseAssignedSum: number
  isQualified: number
  isQualifiedAssigned: number
  renewalRateTeam: number
}

export interface BatchUpsertApmInput {
  items: BatchUpsertApmItem[]
}

export interface BatchUpsertApmResult {
  processedCount: number
  createdCount: number
  updatedCount: number
}

export interface RecalculateApmQualificationResult {
  currentPeriod: Period
  nextPeriod: Period
  agentCount: number
  updatedCount: number
  skippedCount: number
}

function normalizeRequiredInt(
  value: number,
  label: string,
  agentCode: string,
): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label}必须为整数: ${agentCode}`)
  }

  return value
}

function normalizeRow(
  value: BatchUpsertApmItem,
): BatchUpsertApmItem {
  const agentCode = value.agentCode.trim()

  if (!agentCode) {
    throw new Error('代理人编码不能为空')
  }

  if (agentCode.length > 8) {
    throw new Error(`代理人编码过长: ${agentCode}`)
  }

  const year = normalizeRequiredInt(value.year, '年份', agentCode)
  const month = normalizeRequiredInt(value.month, '月份', agentCode)

  if (year < 2000 || year > 2100) {
    throw new Error(`年份无效: ${agentCode}`)
  }

  if (month < 1 || month > 12) {
    throw new Error(`月份无效: ${agentCode}`)
  }

  return {
    agentCode,
    year,
    month,
    nsc: normalizeRequiredInt(value.nsc, 'NSC', agentCode),
    nscSum: normalizeRequiredInt(value.nscSum, 'NSC累计', agentCode),
    netAfycSum: normalizeRequiredInt(value.netAfycSum, 'AFYC累计', agentCode),
    netAfyp: normalizeRequiredInt(value.netAfyp, 'AFYP', agentCode),
    netAfypSum: normalizeRequiredInt(value.netAfypSum, 'AFYP累计', agentCode),
    netAfypAssigned: normalizeRequiredInt(value.netAfypAssigned, 'AFYP assigned', agentCode),
    netAfypAssignedSum: normalizeRequiredInt(value.netAfypAssignedSum, 'AFYP assigned累计', agentCode),
    nscHp: normalizeRequiredInt(value.nscHp, 'NSC HP', agentCode),
    nscHpSum: normalizeRequiredInt(value.nscHpSum, 'NSC HP累计', agentCode),
    netAfypHp: normalizeRequiredInt(value.netAfypHp, 'AFYP HP', agentCode),
    netAfypHpSum: normalizeRequiredInt(value.netAfypHpSum, 'AFYP HP累计', agentCode),
    netAfypH: normalizeRequiredInt(value.netAfypH, 'AFYP H', agentCode),
    netAfypHSum: normalizeRequiredInt(value.netAfypHSum, 'AFYP H累计', agentCode),
    netCaseH: normalizeRequiredInt(value.netCaseH, 'CASE H', agentCode),
    netCaseHSum: normalizeRequiredInt(value.netCaseHSum, 'CASE H累计', agentCode),
    netCase: normalizeRequiredInt(value.netCase, 'CASE', agentCode),
    netCaseSum: normalizeRequiredInt(value.netCaseSum, 'CASE累计', agentCode),
    netCaseAssigned: normalizeRequiredInt(value.netCaseAssigned, 'CASE assigned', agentCode),
    netCaseAssignedSum: normalizeRequiredInt(value.netCaseAssignedSum, 'CASE assigned累计', agentCode),
    isQualified: normalizeRequiredInt(value.isQualified, 'QHC', agentCode),
    isQualifiedAssigned: normalizeRequiredInt(value.isQualifiedAssigned, 'QHC assigned', agentCode),
    renewalRateTeam: normalizeRequiredInt(value.renewalRateTeam, '团队续保率', agentCode),
  }
}

function buildRowKey(
  item: Pick<BatchUpsertApmItem, 'agentCode' | 'year' | 'month'>,
): string {
  return `${item.agentCode}:${item.year}:${item.month}`
}

function buildPeriodKey(period: Period): string {
  return `${period.year}:${period.month}`
}

function getPeriodIndex(period: Period): number {
  return period.year * 12 + period.month
}

function addMonths(period: Period, months: number): Period {
  const zeroBasedIndex = period.year * 12 + (period.month - 1) + months

  return {
    year: Math.floor(zeroBasedIndex / 12),
    month: (zeroBasedIndex % 12) + 1,
  }
}

function getCurrentQualificationPeriods(now = new Date()) {
  const current = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }

  return {
    current,
    next: addMonths(current, 1),
  }
}

function parseJoinDate(value: string | null): { year: number; month: number; day: number } | null {
  const matched = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) {
    return null
  }

  const [, year, month, day] = matched

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  }
}

function getMonthsSinceJoin(
  joinDate: { year: number; month: number; day: number },
  period: Period,
): number {
  const rawMonths = (period.year - joinDate.year) * 12 + (period.month - joinDate.month)

  return joinDate.day > 1 ? rawMonths - 1 : rawMonths
}

function getQuarter(period: Period): number {
  return Math.floor((period.month - 1) / 3) + 1
}

function isQuarterEndMonth(period: Period): boolean {
  return period.month === 3
    || period.month === 6
    || period.month === 9
    || period.month === 12
}

function shouldRecalculateQualification(
  row: BatchUpsertApmItem,
  existingRow?: {
    nscSum: number
    qualifiedGap: number | null
    isQualifiedNextMonth: boolean | null
    qualifiedGapNextMonth: number | null
  },
): boolean {
  if (!existingRow) {
    return true
  }

  return existingRow.nscSum !== row.nscSum
    || existingRow.qualifiedGap == null
    || existingRow.isQualifiedNextMonth == null
    || existingRow.qualifiedGapNextMonth == null
}

async function getSalesTotal(
  db: DB,
  agentCode: string,
  startPeriod: Period,
  endPeriod: Period,
): Promise<number> {
  const startIndex = getPeriodIndex(startPeriod)
  const endIndex = getPeriodIndex(endPeriod)
  const periodIndex = sql<number>`${apm.year} * 12 + ${apm.month}`

  const rows = await db
    .select({
      total: sum(apm.nsc).mapWith(Number),
    })
    .from(apm)
    .where(and(
      eq(apm.agentCode, agentCode),
      gte(periodIndex, startIndex),
      lte(periodIndex, endIndex),
    ))

  return rows[0]?.total ?? 0
}

async function getDirectTeamNsc(
  db: DB,
  agentCode: string,
  startPeriod: Period,
  endPeriod: Period,
): Promise<number> {
  const startIndex = getPeriodIndex(startPeriod)
  const endIndex = getPeriodIndex(endPeriod)
  const periodIndex = sql<number>`${apm.year} * 12 + ${apm.month}`

  const rows = await db
    .select({
      total: sum(apm.nsc).mapWith(Number),
    })
    .from(apm)
    .innerJoin(
      agentHierarchy,
      eq(apm.agentCode, agentHierarchy.agentCode),
    )
    .where(and(
      eq(agentHierarchy.leaderCode, agentCode),
      eq(agentHierarchy.hierarchy, 1),
      gte(periodIndex, startIndex),
      lte(periodIndex, endIndex),
    ))

  return rows[0]?.total ?? 0
}

async function getPreviousMonthQualified(
  db: DB,
  agentCode: string,
  period: Period,
): Promise<boolean> {
  const previousPeriod = addMonths(period, -1)
  const rows = await db
    .select({
      isQualified: apm.isQualified,
    })
    .from(apm)
    .where(and(
      eq(apm.agentCode, agentCode),
      eq(apm.year, previousPeriod.year),
      eq(apm.month, previousPeriod.month),
    ))
    .limit(1)

  return Number(rows[0]?.isQualified ?? 0) > 0
}

async function evaluateNewAgentQualification(
  db: DB,
  agent: AgentQualificationProfile,
  joinDate: { year: number; month: number; day: number },
  period: Period,
): Promise<QualificationResult> {
  const startPeriod = {
    year: joinDate.year,
    month: joinDate.month,
  }
  const numMonths = getPeriodIndex(period) - getPeriodIndex(startPeriod) + 1
  const targetSales = Math.max(
    QUALIFICATION_CONFIG.newAgentMonthlyTarget * numMonths,
    QUALIFICATION_CONFIG.newAgentMonthlyTarget * 2,
  )
  const actualSales = await getSalesTotal(db, agent.agentCode, startPeriod, period)
  const qualifiedGap = actualSales - targetSales

  return {
    isQualified: qualifiedGap >= 0,
    qualifiedGap,
  }
}

async function evaluateSeniorAgentQualification(
  db: DB,
  agent: AgentQualificationProfile,
  period: Period,
): Promise<QualificationResult> {
  if (agent.designation != null && agent.designation >= RM_DESIGNATION) {
    const targetBase = SENIOR_TEAM_NSC_TARGETS[agent.designation - RM_DESIGNATION]

    if (targetBase != null) {
      const directTeamNsc = await getDirectTeamNsc(
        db,
        agent.agentCode,
        addMonths(period, -12),
        period,
      )

      if (directTeamNsc - targetBase * 100 >= 0) {
        return {
          isQualified: true,
          qualifiedGap: 0,
        }
      }
    }
  }

  const isPreviousMonthQualified = await getPreviousMonthQualified(db, agent.agentCode, period)

  if (isPreviousMonthQualified && !isQuarterEndMonth(period)) {
    return {
      isQualified: true,
      qualifiedGap: 0,
    }
  }

  const targetSales = QUALIFICATION_CONFIG.seniorQuarterlyTargets[getQuarter(period) - 1]
  const actualSales = await getSalesTotal(
    db,
    agent.agentCode,
    {
      year: period.year,
      month: 1,
    },
    period,
  )
  const qualifiedGap = actualSales - targetSales

  return {
    isQualified: qualifiedGap >= 0,
    qualifiedGap,
  }
}

async function calculateAgentQualification(
  db: DB,
  agent: AgentQualificationProfile,
  period: Period,
): Promise<QualificationResult | null> {
  const joinDate = parseJoinDate(agent.joinDate)
  if (!joinDate) {
    return null
  }

  const monthsSinceJoin = getMonthsSinceJoin(joinDate, period)
  if (monthsSinceJoin <= 0) {
    return null
  }

  if (monthsSinceJoin < 12) {
    return evaluateNewAgentQualification(db, agent, joinDate, period)
  }

  return evaluateSeniorAgentQualification(db, agent, period)
}

async function updateCurrentQualification(
  db: DB,
  agentCode: string,
  currentPeriod: Period,
  currentQualification: QualificationResult,
  nextQualification: QualificationResult | null,
) {
  await db
    .update(apm)
    .set({
      qualifiedGap: currentQualification.qualifiedGap,
      ...(nextQualification
        ? {
            isQualifiedNextMonth: nextQualification.isQualified,
            qualifiedGapNextMonth: nextQualification.qualifiedGap,
          }
        : {}),
    })
    .where(and(
      eq(apm.agentCode, agentCode),
      eq(apm.year, currentPeriod.year),
      eq(apm.month, currentPeriod.month),
    ))
}

async function updateNextQualification(
  db: DB,
  agentCode: string,
  nextPeriod: Period,
  nextQualification: QualificationResult,
) {
  await db
    .update(apm)
    .set({
      qualifiedGap: nextQualification.qualifiedGap,
    })
    .where(and(
      eq(apm.agentCode, agentCode),
      eq(apm.year, nextPeriod.year),
      eq(apm.month, nextPeriod.month),
    ))
}

export class BatchUpsertApmCommand {
  private readonly db: DB
  private readonly input: BatchUpsertApmInput

  constructor(input: BatchUpsertApmInput) {
    this.db = getDb()
    this.input = input
  }

  async execute(): Promise<BatchUpsertApmResult> {
    const rows = this.input.items.map(normalizeRow)

    if (rows.length === 0) {
      throw new Error('没有可导入的月汇总数据')
    }

    const dedupedRows = new Map<string, BatchUpsertApmItem>()

    for (const row of rows) {
      const key = buildRowKey(row)
      if (dedupedRows.has(key)) {
        throw new Error(`CSV 中存在重复的代理人月份记录: ${row.agentCode} ${row.year}-${String(row.month).padStart(2, '0')}`)
      }

      dedupedRows.set(key, row)
    }

    return this.db.transaction(async (tx) => {
      const importedRows = [...dedupedRows.values()]
      const importedCodes = [...new Set(importedRows.map((row) => row.agentCode))]

      const existingAgents = await tx
        .select({
          agentCode: agents.agentCode,
          joinDate: agents.joinDate,
          designation: agents.designation,
        })
        .from(agents)
        .where(inArray(agents.agentCode, importedCodes))

      const existingAgentCodes = new Set(
        existingAgents
          .map((row) => row.agentCode)
          .filter((value): value is string => !!value),
      )
      const existingAgentByCode = new Map(
        existingAgents
          .filter((agent): agent is AgentQualificationProfile => !!agent.agentCode)
          .map((agent) => [agent.agentCode, agent]),
      )

      const validRows = importedRows.filter((row) => existingAgentCodes.has(row.agentCode))

      if (validRows.length === 0) {
        return {
          processedCount: 0,
          createdCount: 0,
          updatedCount: 0,
        }
      }

      const validCodes = [...new Set(validRows.map((row) => row.agentCode))]
      const validYears = [...new Set(validRows.map((row) => row.year))]
      const validMonths = [...new Set(validRows.map((row) => row.month))]

      const existingRows = await tx
        .select({
          agentCode: apm.agentCode,
          year: apm.year,
          month: apm.month,
          nscSum: apm.nscSum,
          qualifiedGap: apm.qualifiedGap,
          isQualifiedNextMonth: apm.isQualifiedNextMonth,
          qualifiedGapNextMonth: apm.qualifiedGapNextMonth,
        })
        .from(apm)
        .where(and(
          inArray(apm.agentCode, validCodes),
          inArray(apm.year, validYears),
          inArray(apm.month, validMonths),
        ))

      const existingRowByKey = new Map(
        existingRows.map((row) => [buildRowKey(row), row]),
      )
      const qualificationPeriods = getCurrentQualificationPeriods()
      const currentPeriodKey = buildPeriodKey(qualificationPeriods.current)
      const nextPeriodKey = buildPeriodKey(qualificationPeriods.next)
      const qualificationAgentCodes = new Set<string>()

      let createdCount = 0
      let updatedCount = 0

      for (const row of validRows) {
        const values: NewApmRow = {
          agentCode: row.agentCode,
          year: row.year,
          month: row.month,
          nsc: row.nsc,
          nscSum: row.nscSum,
          netAfycSum: row.netAfycSum,
          netAfyp: row.netAfyp,
          netAfypSum: row.netAfypSum,
          netAfypAssigned: row.netAfypAssigned,
          netAfypAssignedSum: row.netAfypAssignedSum,
          nscHp: row.nscHp,
          nscHpSum: row.nscHpSum,
          netAfypHp: row.netAfypHp,
          netAfypHpSum: row.netAfypHpSum,
          netAfypH: row.netAfypH,
          netAfypHSum: row.netAfypHSum,
          netCaseH: row.netCaseH,
          netCaseHSum: row.netCaseHSum,
          netCase: row.netCase,
          netCaseSum: row.netCaseSum,
          netCaseAssigned: row.netCaseAssigned,
          netCaseAssignedSum: row.netCaseAssignedSum,
          isQualified: row.isQualified,
          isQualifiedAssigned: row.isQualifiedAssigned,
          renewalRateTeam: row.renewalRateTeam,
        }
        const rowKey = buildRowKey(row)
        const periodKey = buildPeriodKey(row)

        if (existingRowByKey.has(rowKey)) {
          updatedCount += 1
        } else {
          createdCount += 1
        }

        if (
          (periodKey === currentPeriodKey || periodKey === nextPeriodKey)
          && shouldRecalculateQualification(row, existingRowByKey.get(rowKey))
        ) {
          qualificationAgentCodes.add(row.agentCode)
        }

        await tx
          .insert(apm)
          .values(values)
          .onDuplicateKeyUpdate({
            set: {
              nsc: row.nsc,
              nscSum: row.nscSum,
              netAfycSum: row.netAfycSum,
              netAfyp: row.netAfyp,
              netAfypSum: row.netAfypSum,
              netAfypAssigned: row.netAfypAssigned,
              netAfypAssignedSum: row.netAfypAssignedSum,
              nscHp: row.nscHp,
              nscHpSum: row.nscHpSum,
              netAfypHp: row.netAfypHp,
              netAfypHpSum: row.netAfypHpSum,
              netAfypH: row.netAfypH,
              netAfypHSum: row.netAfypHSum,
              netCaseH: row.netCaseH,
              netCaseHSum: row.netCaseHSum,
              netCase: row.netCase,
              netCaseSum: row.netCaseSum,
              netCaseAssigned: row.netCaseAssigned,
              netCaseAssignedSum: row.netCaseAssignedSum,
              isQualified: row.isQualified,
              isQualifiedAssigned: row.isQualifiedAssigned,
              renewalRateTeam: row.renewalRateTeam,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            },
          })
      }

      for (const agentCode of qualificationAgentCodes) {
        const agent = existingAgentByCode.get(agentCode)

        if (!agent) {
          continue
        }

        const currentQualification = await calculateAgentQualification(
          tx as unknown as DB,
          agent,
          qualificationPeriods.current,
        )
        const nextQualification = await calculateAgentQualification(
          tx as unknown as DB,
          agent,
          qualificationPeriods.next,
        )

        if (currentQualification) {
          await updateCurrentQualification(
            tx as unknown as DB,
            agentCode,
            qualificationPeriods.current,
            currentQualification,
            nextQualification,
          )
        }

        if (nextQualification) {
          await updateNextQualification(
            tx as unknown as DB,
            agentCode,
            qualificationPeriods.next,
            nextQualification,
          )
        }
      }

      return {
        processedCount: validRows.length,
        createdCount,
        updatedCount,
      }
    })
  }
}

export class RecalculateApmQualificationCommand {
  private readonly db: DB

  constructor() {
    this.db = getDb()
  }

  async execute(): Promise<RecalculateApmQualificationResult> {
    const qualificationPeriods = getCurrentQualificationPeriods()

    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({
          agentCode: apm.agentCode,
          year: apm.year,
          month: apm.month,
          joinDate: agents.joinDate,
          designation: agents.designation,
        })
        .from(apm)
        .innerJoin(
          agents,
          eq(apm.agentCode, agents.agentCode),
        )
        .where(or(
          and(
            eq(apm.year, qualificationPeriods.current.year),
            eq(apm.month, qualificationPeriods.current.month),
          ),
          and(
            eq(apm.year, qualificationPeriods.next.year),
            eq(apm.month, qualificationPeriods.next.month),
          ),
        ))

      const agentsByCode = new Map<string, AgentQualificationProfile>()
      const currentPeriodAgentCodes = new Set<string>()
      const nextPeriodAgentCodes = new Set<string>()
      const currentPeriodKey = buildPeriodKey(qualificationPeriods.current)

      for (const row of rows) {
        agentsByCode.set(row.agentCode, {
          agentCode: row.agentCode,
          joinDate: row.joinDate,
          designation: row.designation,
        })

        const periodKey = buildPeriodKey(row)
        if (periodKey === currentPeriodKey) {
          currentPeriodAgentCodes.add(row.agentCode)
        } else {
          nextPeriodAgentCodes.add(row.agentCode)
        }
      }

      let updatedCount = 0
      let skippedCount = 0

      for (const [agentCode, agent] of agentsByCode) {
        const currentQualification = await calculateAgentQualification(
          tx as unknown as DB,
          agent,
          qualificationPeriods.current,
        )
        const nextQualification = await calculateAgentQualification(
          tx as unknown as DB,
          agent,
          qualificationPeriods.next,
        )

        if (!currentQualification && !nextQualification) {
          skippedCount += 1
          continue
        }

        if (currentQualification && currentPeriodAgentCodes.has(agentCode)) {
          await updateCurrentQualification(
            tx as unknown as DB,
            agentCode,
            qualificationPeriods.current,
            currentQualification,
            nextQualification,
          )
          updatedCount += 1
        }

        if (nextQualification && nextPeriodAgentCodes.has(agentCode)) {
          await updateNextQualification(
            tx as unknown as DB,
            agentCode,
            qualificationPeriods.next,
            nextQualification,
          )
          updatedCount += 1
        }
      }

      return {
        currentPeriod: qualificationPeriods.current,
        nextPeriod: qualificationPeriods.next,
        agentCount: agentsByCode.size,
        updatedCount,
        skippedCount,
      }
    })
  }
}
