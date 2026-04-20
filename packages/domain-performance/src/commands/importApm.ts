import { withTransaction } from '../context'
import { Apm } from '../domain/apm'
import { normalizeAgentCode } from '../domain/agentCode'
import type { DomainEvent } from '../domain/events'
import { normalizeImportedApmMetrics, type ImportedApmMetrics } from '../domain/performanceMetrics'
import { formatPeriodKey, getCurrentQualificationPeriods, type Period } from '../domain/period'
import { QualificationPolicy } from '../domain/qualification/policy'
import { createPerformanceRuntime, type PerformanceRuntime } from '../infra/defaultDeps'

export interface ImportApmItem extends ImportedApmMetrics {
  agentCode: string
  year: number
  month: number
}

export interface ImportApmInput {
  items: ImportApmItem[]
}

export interface ImportApmResult {
  processedCount: number
  createdCount: number
  updatedCount: number
}

export interface ImportApmDependencies {
  executeInTransaction<T>(work: (runtime: PerformanceRuntime) => Promise<T>): Promise<T>
  now(): Date
}

export class ImportApmCommand {
  private readonly input: ImportApmInput
  private readonly dependencies: ImportApmDependencies

  constructor(
    input: ImportApmInput,
    dependencies?: Partial<ImportApmDependencies>,
  ) {
    this.input = input
    this.dependencies = {
      executeInTransaction: dependencies?.executeInTransaction
        ?? ((work) => withTransaction((tx) => work(createPerformanceRuntime(tx)))),
      now: dependencies?.now ?? (() => new Date()),
    }
  }

  async execute(): Promise<ImportApmResult> {
    const rows = this.input.items.map((item) => normalizeImportApmItem(item))

    if (rows.length === 0) {
      throw new Error('没有可导入的月汇总数据')
    }

    const dedupedRows = new Map<string, ImportApmItem>()

    for (const row of rows) {
      const key = buildRowKey(row.agentCode, {
        year: row.year,
        month: row.month,
      })
      if (dedupedRows.has(key)) {
        throw new Error(`CSV 中存在重复的代理人月份记录: ${row.agentCode} ${row.year}-${String(row.month).padStart(2, '0')}`)
      }

      dedupedRows.set(key, row)
    }

    const { now: nowFn, executeInTransaction } = this.dependencies
    const now = nowFn()
    const qualificationPeriods = getCurrentQualificationPeriods(now)
    const currentPeriodKey = formatPeriodKey(qualificationPeriods.current)
    const nextPeriodKey = formatPeriodKey(qualificationPeriods.next)

    return executeInTransaction(async (runtime) => {
      const importedRows = [...dedupedRows.values()]
      const importedCodes = [...new Set(importedRows.map((row) => row.agentCode))]
      const profiles = await runtime.agentDirectoryPort.listProfiles(importedCodes)
      const profileByCode = new Map(profiles.map((profile) => [profile.agentCode, profile]))
      const validRows = importedRows.filter((row) => profileByCode.has(row.agentCode))

      if (validRows.length === 0) {
        return {
          processedCount: 0,
          createdCount: 0,
          updatedCount: 0,
        }
      }

      const existingApms = await runtime.apmRepository.findByKeys(
        validRows.map((row) => ({
          agentCode: row.agentCode,
          period: {
            year: row.year,
            month: row.month,
          },
        })),
      )
      const existingByKey = new Map(
        existingApms.map((entity) => [buildRowKey(entity.agentCode, entity.period), entity]),
      )

      const qualificationPolicy = new QualificationPolicy(
        runtime.performanceReadRepository,
        runtime.teamHierarchyPort,
      )
      const qualificationAgentCodes = new Set<string>()
      const events: DomainEvent[] = []

      let createdCount = 0
      let updatedCount = 0

      for (const row of validRows) {
        const period = {
          year: row.year,
          month: row.month,
        }
        const rowKey = buildRowKey(row.agentCode, period)
        const existing = existingByKey.get(rowKey)
        const metrics = extractImportedMetrics(row)
        const entity = existing ?? Apm.create({
          agentCode: row.agentCode,
          period,
          metrics,
          occurredAt: now,
        })

        if (existing) {
          updatedCount += 1
          entity.updateImportedMetrics(metrics, now)
        } else {
          createdCount += 1
        }

        const periodKey = formatPeriodKey(period)
        if (
          (periodKey === currentPeriodKey || periodKey === nextPeriodKey)
          && shouldRecalculateQualification(metrics, existing?.metrics)
        ) {
          qualificationAgentCodes.add(row.agentCode)
        }

        await runtime.apmRepository.save(entity)
        events.push(...entity.pullDomainEvents())
      }

      for (const agentCode of qualificationAgentCodes) {
        const profile = profileByCode.get(agentCode)
        if (!profile) {
          continue
        }

        const [currentAssessment, nextAssessment] = await Promise.all([
          qualificationPolicy.evaluate(profile, qualificationPeriods.current),
          qualificationPolicy.evaluate(profile, qualificationPeriods.next),
        ])
        const relatedApms = await runtime.apmRepository.findByKeys([
          {
            agentCode,
            period: qualificationPeriods.current,
          },
          {
            agentCode,
            period: qualificationPeriods.next,
          },
        ])
        const relatedApmByKey = new Map(
          relatedApms.map((entity) => [buildRowKey(entity.agentCode, entity.period), entity]),
        )
        const currentApm = relatedApmByKey.get(buildRowKey(agentCode, qualificationPeriods.current))
        const nextApm = relatedApmByKey.get(buildRowKey(agentCode, qualificationPeriods.next))

        if (currentApm && currentAssessment) {
          const changed = currentApm.refreshCurrentQualification({
            qualifiedGap: currentAssessment.qualifiedGap,
            ...(nextAssessment
              ? {
                  isQualifiedNextMonth: nextAssessment.isQualified,
                  qualifiedGapNextMonth: nextAssessment.qualifiedGap,
                }
              : {}),
          }, now)

          if (changed) {
            await runtime.apmRepository.save(currentApm)
            events.push(...currentApm.pullDomainEvents())
          }
        }

        if (nextApm && nextAssessment) {
          const changed = nextApm.refreshProjectedQualification(nextAssessment.qualifiedGap, now)

          if (changed) {
            await runtime.apmRepository.save(nextApm)
            events.push(...nextApm.pullDomainEvents())
          }
        }
      }

      await runtime.domainEventStore.append(events)

      return {
        processedCount: validRows.length,
        createdCount,
        updatedCount,
      }
    })
  }
}

function normalizeImportApmItem(input: ImportApmItem): ImportApmItem {
  const agentCode = normalizeAgentCode(input.agentCode)
  const year = input.year
  const month = input.month

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`年份无效: ${agentCode}`)
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`月份无效: ${agentCode}`)
  }

  return {
    agentCode,
    year,
    month,
    ...normalizeImportedApmMetrics(extractImportedMetrics(input), agentCode),
  }
}

function extractImportedMetrics(input: ImportApmItem): ImportedApmMetrics {
  return {
    nsc: input.nsc,
    nscSum: input.nscSum,
    netAfycSum: input.netAfycSum,
    netAfyp: input.netAfyp,
    netAfypSum: input.netAfypSum,
    netAfypAssigned: input.netAfypAssigned,
    netAfypAssignedSum: input.netAfypAssignedSum,
    nscHp: input.nscHp,
    nscHpSum: input.nscHpSum,
    netAfypHp: input.netAfypHp,
    netAfypHpSum: input.netAfypHpSum,
    netAfypH: input.netAfypH,
    netAfypHSum: input.netAfypHSum,
    netCaseH: input.netCaseH,
    netCaseHSum: input.netCaseHSum,
    netCase: input.netCase,
    netCaseSum: input.netCaseSum,
    netCaseAssigned: input.netCaseAssigned,
    netCaseAssignedSum: input.netCaseAssignedSum,
    isQualified: input.isQualified,
    isQualifiedAssigned: input.isQualifiedAssigned,
    renewalRateTeam: input.renewalRateTeam,
  }
}

function buildRowKey(agentCode: string, period: Period): string {
  return `${agentCode}:${period.year}:${period.month}`
}

function shouldRecalculateQualification(
  row: ImportedApmMetrics,
  existing?: {
    nscSum: number
    qualifiedGap: number | null
    isQualifiedNextMonth: boolean | null
    qualifiedGapNextMonth: number | null
  },
): boolean {
  if (!existing) {
    return true
  }

  return existing.nscSum !== row.nscSum
    || existing.qualifiedGap == null
    || existing.isQualifiedNextMonth == null
    || existing.qualifiedGapNextMonth == null
}
