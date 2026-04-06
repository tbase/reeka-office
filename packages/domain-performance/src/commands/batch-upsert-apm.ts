import { agents } from '@reeka-office/domain-agent'
import { and, eq, inArray, sql } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import {
  apm,
  type NewApmRow,
} from '../schema'

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
        })
        .from(agents)
        .where(inArray(agents.agentCode, importedCodes))

      const existingAgentCodes = new Set(
        existingAgents
          .map((row) => row.agentCode)
          .filter((value): value is string => !!value),
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
        })
        .from(apm)
        .where(and(
          inArray(apm.agentCode, validCodes),
          inArray(apm.year, validYears),
          inArray(apm.month, validMonths),
        ))

      const existingKeys = new Set(
        existingRows
          .filter((row) => dedupedRows.has(buildRowKey({
            agentCode: row.agentCode,
            year: row.year,
            month: row.month,
          })))
          .map((row) => buildRowKey({
            agentCode: row.agentCode,
            year: row.year,
            month: row.month,
          })),
      )

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

        if (existingKeys.has(rowKey)) {
          updatedCount += 1
        } else {
          createdCount += 1
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

      return {
        processedCount: validRows.length,
        createdCount,
        updatedCount,
      }
    })
  }
}
