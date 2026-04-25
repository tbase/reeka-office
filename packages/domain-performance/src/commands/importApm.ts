import type { AgentLogChange, AppendAgentLogInput } from '@reeka-office/domain-agent'
import type { PerformanceApplicationDependencies } from '../application/runtime'
import { QualificationEvaluator } from '../application/qualificationEvaluator'
import { Apm } from '../domain/apm'
import { normalizeAgentCode } from '../domain/agentCode'
import type { DomainEvent } from '../domain/events'
import {
  normalizeImportedApmMetrics,
  type ImportedApmMetrics,
  type StoredApmMetrics,
} from '../domain/performanceMetrics'
import { formatPeriodKey, getCurrentQualificationPeriods, type Period } from '../domain/period'
import { toQualificationMetricValue } from '../domain/qualification/assessment'

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

const IMPORTED_METRIC_FIELDS = [
  'nsc',
  'nscSum',
  'netAfycSum',
  'netAfyp',
  'netAfypSum',
  'netAfypAssigned',
  'netAfypAssignedSum',
  'nscHp',
  'nscHpSum',
  'netAfypHp',
  'netAfypHpSum',
  'netAfypH',
  'netAfypHSum',
  'netCaseH',
  'netCaseHSum',
  'netCase',
  'netCaseSum',
  'netCaseAssigned',
  'netCaseAssignedSum',
  'isQualified',
  'isQualifiedAssigned',
  'renewalRateTeam',
] as const satisfies ReadonlyArray<keyof ImportedApmMetrics>

const CURRENT_QUALIFICATION_FIELDS = [
  'qualifiedGap',
  'isQualifiedNextMonth',
  'qualifiedGapNextMonth',
] as const satisfies ReadonlyArray<keyof StoredApmMetrics>

const PROJECTED_QUALIFICATION_FIELDS = [
  'qualifiedGap',
] as const satisfies ReadonlyArray<keyof StoredApmMetrics>

export class ImportApmCommand {
  private readonly input: ImportApmInput
  private readonly dependencies: PerformanceApplicationDependencies

  constructor(
    input: ImportApmInput,
    dependencies: PerformanceApplicationDependencies,
  ) {
    this.input = input
    this.dependencies = dependencies
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

      const qualificationEvaluator = new QualificationEvaluator(
        runtime.performanceReadRepository,
        runtime.teamHierarchyPort,
      )
      const qualificationAgentCodes = new Set<string>()
      const events: DomainEvent[] = []
      const logs: AppendAgentLogInput[] = []

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
          const beforeMetrics = { ...existing.metrics }
          const changed = entity.updateImportedMetrics(metrics, now)

          if (changed) {
            updatedCount += 1
            await runtime.apmRepository.save(entity)
            events.push(...entity.pullDomainEvents())
            logs.push({
              agentCode: row.agentCode,
              category: 'apm',
              action: 'updated',
              periodYear: period.year,
              periodMonth: period.month,
              source: 'ImportApmCommand',
              changes: buildImportedMetricChanges(beforeMetrics, metrics),
            })
          }
        } else {
          createdCount += 1
          await runtime.apmRepository.save(entity)
          events.push(...entity.pullDomainEvents())
          logs.push({
            agentCode: row.agentCode,
            category: 'apm',
            action: 'created',
            periodYear: period.year,
            periodMonth: period.month,
            source: 'ImportApmCommand',
            changes: buildImportedMetricChanges(null, metrics),
          })
        }

        const periodKey = formatPeriodKey(period)
        if (
          (periodKey === currentPeriodKey || periodKey === nextPeriodKey)
          && shouldRecalculateQualification(metrics, existing?.metrics)
        ) {
          qualificationAgentCodes.add(row.agentCode)
        }
      }

      for (const agentCode of qualificationAgentCodes) {
        const profile = profileByCode.get(agentCode)
        if (!profile) {
          continue
        }

        const [currentAssessment, nextAssessment] = await Promise.all([
          qualificationEvaluator.evaluate(profile, qualificationPeriods.current),
          qualificationEvaluator.evaluate(profile, qualificationPeriods.next),
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
          const beforeMetrics = { ...currentApm.metrics }
          const changed = currentApm.refreshCurrentQualification({
            qualifiedGap: currentAssessment.qualifiedGap,
            ...(nextAssessment
              ? {
                  isQualifiedNextMonth: toQualificationMetricValue(nextAssessment),
                  qualifiedGapNextMonth: nextAssessment.qualifiedGap,
                }
              : {}),
          }, now)

          if (changed) {
            await runtime.apmRepository.save(currentApm)
            events.push(...currentApm.pullDomainEvents())
            logs.push({
              agentCode,
              category: 'apm',
              action: 'updated',
              periodYear: qualificationPeriods.current.year,
              periodMonth: qualificationPeriods.current.month,
              source: 'ImportApmCommand',
              changes: buildStoredMetricChanges(
                beforeMetrics,
                currentApm.metrics,
                CURRENT_QUALIFICATION_FIELDS,
              ),
            })
          }
        }

        if (nextApm && nextAssessment) {
          const beforeMetrics = { ...nextApm.metrics }
          const changed = nextApm.refreshProjectedQualification(nextAssessment.qualifiedGap, now)

          if (changed) {
            await runtime.apmRepository.save(nextApm)
            events.push(...nextApm.pullDomainEvents())
            logs.push({
              agentCode,
              category: 'apm',
              action: 'updated',
              periodYear: qualificationPeriods.next.year,
              periodMonth: qualificationPeriods.next.month,
              source: 'ImportApmCommand',
              changes: buildStoredMetricChanges(
                beforeMetrics,
                nextApm.metrics,
                PROJECTED_QUALIFICATION_FIELDS,
              ),
            })
          }
        }
      }

      await runtime.agentLogStore.append(logs)
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

function buildImportedMetricChanges(
  before: ImportedApmMetrics | StoredApmMetrics | null,
  after: ImportedApmMetrics,
): AgentLogChange[] {
  return IMPORTED_METRIC_FIELDS.flatMap((field) => {
    const beforeValue = before?.[field] ?? null
    const afterValue = after[field]

    if (before && beforeValue === afterValue) {
      return []
    }

    return [{
      field,
      before: beforeValue,
      after: afterValue,
    }]
  })
}

function buildStoredMetricChanges<const TField extends keyof StoredApmMetrics>(
  before: Pick<StoredApmMetrics, TField>,
  after: Pick<StoredApmMetrics, TField>,
  fields: readonly TField[],
): AgentLogChange[] {
  return fields.flatMap((field) => {
    if (before[field] === after[field]) {
      return []
    }

    return [{
      field,
      before: before[field],
      after: after[field],
    }]
  })
}

function shouldRecalculateQualification(
  row: ImportedApmMetrics,
  existing?: {
    nscSum: number
    qualifiedGap: number | null
    isQualifiedNextMonth: number | null
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
