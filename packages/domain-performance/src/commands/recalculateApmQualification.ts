import { withTransaction } from '../context'
import type { DomainEvent } from '../domain/events'
import { getCurrentQualificationPeriods } from '../domain/period'
import { QualificationPolicy } from '../domain/qualification/policy'
import { createPerformanceRuntime, type PerformanceRuntime } from '../infra/defaultDeps'

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
}

export interface RecalculateApmQualificationDependencies {
  executeInTransaction<T>(work: (runtime: PerformanceRuntime) => Promise<T>): Promise<T>
  now(): Date
}

export class RecalculateApmQualificationCommand {
  private readonly dependencies: RecalculateApmQualificationDependencies

  constructor(dependencies?: Partial<RecalculateApmQualificationDependencies>) {
    this.dependencies = {
      executeInTransaction: dependencies?.executeInTransaction
        ?? ((work) => withTransaction((tx) => work(createPerformanceRuntime(tx)))),
      now: dependencies?.now ?? (() => new Date()),
    }
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
      const qualificationPolicy = new QualificationPolicy(
        runtime.performanceReadRepository,
        runtime.teamHierarchyPort,
      )
      const events: DomainEvent[] = []

      let updatedCount = 0
      let skippedCount = 0

      for (const [agentCode, profile] of profileByCode) {
        const [currentAssessment, nextAssessment] = await Promise.all([
          qualificationPolicy.evaluate(profile, qualificationPeriods.current),
          qualificationPolicy.evaluate(profile, qualificationPeriods.next),
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
          updatedCount += 1
        }

        if (nextApm && nextAssessment && nextAgentCodes.has(agentCode)) {
          const changed = nextApm.refreshProjectedQualification(nextAssessment.qualifiedGap, now)

          if (changed) {
            await runtime.apmRepository.save(nextApm)
            events.push(...nextApm.pullDomainEvents())
          }
          updatedCount += 1
        }
      }

      await runtime.domainEventStore.append(events)

      return {
        currentPeriod: qualificationPeriods.current,
        nextPeriod: qualificationPeriods.next,
        agentCount: profileByCode.size,
        updatedCount,
        skippedCount,
      }
    })
  }
}
