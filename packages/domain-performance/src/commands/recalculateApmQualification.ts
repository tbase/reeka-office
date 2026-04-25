import type { AgentLogChange, AppendAgentLogInput } from '@reeka-office/domain-agent'
import type { PerformanceApplicationDependencies } from '../application/runtime'
import { QualificationEvaluator } from '../application/qualificationEvaluator'
import type { DomainEvent } from '../domain/events'
import type { StoredApmMetrics } from '../domain/performanceMetrics'
import type { AgentProfile } from '../domain/ports'
import { getCurrentQualificationPeriods, type Period } from '../domain/period'
import { toQualificationMetricValue } from '../domain/qualification/assessment'

export type RecalculateApmQualificationGapField =
  | 'qualifiedGap'
  | 'qualifiedGapNextMonth'

export interface RecalculateApmQualificationGapChange {
  agentCode: string
  agentName: string | null
  designation: number | null
  joinDate: string | null
  lastPromotionDate: string | null
  period: {
    year: number
    month: number
  }
  field: RecalculateApmQualificationGapField
  before: number | null
  after: number | null
}

export interface RecalculateApmQualificationResult {
  currentPeriod: {
    year: number
    month: number
  }
  nextPeriod: {
    year: number
    month: number
  }
  agentCount: number
  updatedCount: number
  skippedCount: number
  gapChanges: RecalculateApmQualificationGapChange[]
}

const CURRENT_QUALIFICATION_FIELDS = [
  'qualifiedGap',
  'isQualifiedNextMonth',
  'qualifiedGapNextMonth',
] as const satisfies ReadonlyArray<keyof StoredApmMetrics>

const PROJECTED_QUALIFICATION_FIELDS = [
  'qualifiedGap',
] as const satisfies ReadonlyArray<keyof StoredApmMetrics>

const CURRENT_GAP_FIELDS = [
  'qualifiedGap',
  'qualifiedGapNextMonth',
] as const satisfies ReadonlyArray<RecalculateApmQualificationGapField>

const PROJECTED_GAP_FIELDS = [
  'qualifiedGap',
] as const satisfies ReadonlyArray<RecalculateApmQualificationGapField>

export class RecalculateApmQualificationCommand {
  private readonly dependencies: PerformanceApplicationDependencies

  constructor(dependencies: PerformanceApplicationDependencies) {
    this.dependencies = dependencies
  }

  async execute(): Promise<RecalculateApmQualificationResult> {
    const { now: nowFn, executeInTransaction } = this.dependencies
    const now = nowFn()
    const qualificationPeriods = getCurrentQualificationPeriods(now)

    return executeInTransaction(async (runtime) => {
      const periodRows = await runtime.performanceReadRepository.listAgentCodesForPeriods([
        qualificationPeriods.current,
        qualificationPeriods.next,
      ])
      const currentAgentCodes = new Set(
        periodRows
          .filter((row) => row.period.year === qualificationPeriods.current.year && row.period.month === qualificationPeriods.current.month)
          .map((row) => row.agentCode),
      )
      const nextAgentCodes = new Set(
        periodRows
          .filter((row) => row.period.year === qualificationPeriods.next.year && row.period.month === qualificationPeriods.next.month)
          .map((row) => row.agentCode),
      )
      const profiles = await runtime.agentDirectoryPort.listProfiles([
        ...new Set(periodRows.map((row) => row.agentCode)),
      ])
      const profileByCode = new Map(profiles.map((profile) => [profile.agentCode, profile]))
      const qualificationEvaluator = new QualificationEvaluator(
        runtime.performanceReadRepository,
        runtime.teamHierarchyPort,
      )
      const events: DomainEvent[] = []
      const logs: AppendAgentLogInput[] = []
      const gapChanges: RecalculateApmQualificationGapChange[] = []

      let updatedCount = 0
      let skippedCount = 0

      for (const [agentCode, profile] of profileByCode) {
        const [currentAssessment, nextAssessment] = await Promise.all([
          qualificationEvaluator.evaluate(profile, qualificationPeriods.current),
          qualificationEvaluator.evaluate(profile, qualificationPeriods.next),
        ])

        if (!currentAssessment && !nextAssessment) {
          skippedCount += 1
          continue
        }

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
          relatedApms.map((entity) => [
            `${entity.agentCode}:${entity.period.year}:${entity.period.month}`,
            entity,
          ]),
        )
        const currentApm = relatedApmByKey.get(
          `${agentCode}:${qualificationPeriods.current.year}:${qualificationPeriods.current.month}`,
        )
        const nextApm = relatedApmByKey.get(
          `${agentCode}:${qualificationPeriods.next.year}:${qualificationPeriods.next.month}`,
        )

        if (currentApm && currentAssessment && currentAgentCodes.has(agentCode)) {
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
              source: 'RecalculateApmQualificationCommand',
              changes: buildStoredMetricChanges(
                beforeMetrics,
                currentApm.metrics,
                CURRENT_QUALIFICATION_FIELDS,
              ),
            })
            gapChanges.push(...buildGapChanges({
              profile,
              period: qualificationPeriods.current,
              before: beforeMetrics,
              after: currentApm.metrics,
              fields: CURRENT_GAP_FIELDS,
            }))
            updatedCount += 1
          }
        }

        if (nextApm && nextAssessment && nextAgentCodes.has(agentCode)) {
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
              source: 'RecalculateApmQualificationCommand',
              changes: buildStoredMetricChanges(
                beforeMetrics,
                nextApm.metrics,
                PROJECTED_QUALIFICATION_FIELDS,
              ),
            })
            gapChanges.push(...buildGapChanges({
              profile,
              period: qualificationPeriods.next,
              before: beforeMetrics,
              after: nextApm.metrics,
              fields: PROJECTED_GAP_FIELDS,
            }))
            updatedCount += 1
          }
        }
      }

      await runtime.agentLogStore.append(logs)
      await runtime.domainEventStore.append(events)

      return {
        currentPeriod: qualificationPeriods.current,
        nextPeriod: qualificationPeriods.next,
        agentCount: profileByCode.size,
        updatedCount,
        skippedCount,
        gapChanges: gapChanges.sort(compareGapChanges),
      }
    })
  }
}

function buildGapChanges(input: {
  profile: AgentProfile
  period: Period
  before: StoredApmMetrics
  after: StoredApmMetrics
  fields: readonly RecalculateApmQualificationGapField[]
}): RecalculateApmQualificationGapChange[] {
  return input.fields.flatMap((field) => {
    if (input.before[field] === input.after[field]) {
      return []
    }

    return [{
      agentCode: input.profile.agentCode,
      agentName: input.profile.name ?? null,
      designation: input.profile.designation,
      joinDate: input.profile.joinDate,
      lastPromotionDate: input.profile.lastPromotionDate,
      period: input.period,
      field,
      before: input.before[field],
      after: input.after[field],
    }]
  })
}

function compareGapChanges(
  left: RecalculateApmQualificationGapChange,
  right: RecalculateApmQualificationGapChange,
) {
  return left.period.year - right.period.year
    || left.period.month - right.period.month
    || left.agentCode.localeCompare(right.agentCode)
    || left.field.localeCompare(right.field)
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
