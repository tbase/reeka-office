import { AggregateRoot } from '@reeka-office/domain-shared'
import type { DomainEvent, MonthlyPerformanceCreated, MonthlyPerformanceUpdated, QualificationRecalculated } from './events'
import { normalizeAgentCode } from './agentCode'
import { createStoredApmMetrics, normalizeImportedApmMetrics, type ImportedApmMetrics, type StoredApmMetrics } from './performanceMetrics'
import { createPeriod, type Period } from './period'

export interface ApmSnapshot {
  id: number | null
  agentCode: string
  period: Period
  metrics: StoredApmMetrics
}

export class Apm extends AggregateRoot<ApmSnapshot, DomainEvent> {
  private constructor(props: ApmSnapshot) {
    super(props)
  }

  static create(input: {
    agentCode: string
    period: Period
    metrics: ImportedApmMetrics
    occurredAt?: Date
  }): Apm {
    const apm = new Apm({
      id: null,
      agentCode: normalizeAgentCode(input.agentCode),
      period: createPeriod(input.period),
      metrics: createStoredApmMetrics(normalizeImportedApmMetrics(input.metrics, input.agentCode)),
    })

    apm.record({
      type: 'MonthlyPerformanceCreated',
      agentCode: apm.props.agentCode,
      year: apm.props.period.year,
      month: apm.props.period.month,
      occurredAt: input.occurredAt ?? new Date(),
    } satisfies MonthlyPerformanceCreated)

    return apm
  }

  static restore(snapshot: ApmSnapshot): Apm {
    return new Apm({
      id: snapshot.id,
      agentCode: normalizeAgentCode(snapshot.agentCode),
      period: createPeriod(snapshot.period),
      metrics: { ...snapshot.metrics },
    })
  }

  get agentCode() {
    return this.props.agentCode
  }

  get period() {
    return this.props.period
  }

  get metrics() {
    return this.props.metrics
  }

  updateImportedMetrics(metrics: ImportedApmMetrics, occurredAt = new Date()): boolean {
    const normalizedMetrics = normalizeImportedApmMetrics(metrics, this.props.agentCode)
    const nextMetrics = {
      ...this.props.metrics,
      ...normalizedMetrics,
    }

    if (hasSameMetrics(this.props.metrics, nextMetrics)) {
      return false
    }

    this.props.metrics = nextMetrics
    this.record({
      type: 'MonthlyPerformanceUpdated',
      agentCode: this.props.agentCode,
      year: this.props.period.year,
      month: this.props.period.month,
      occurredAt,
    } satisfies MonthlyPerformanceUpdated)

    return true
  }

  refreshCurrentQualification(
    input: {
      qualifiedGap: number
      isQualifiedNextMonth?: number | null
      qualifiedGapNextMonth?: number | null
    },
    occurredAt = new Date(),
  ): boolean {
    const nextIsQualifiedNextMonth = input.isQualifiedNextMonth === undefined
      ? this.props.metrics.isQualifiedNextMonth
      : input.isQualifiedNextMonth
    const nextQualifiedGapNextMonth = input.qualifiedGapNextMonth === undefined
      ? this.props.metrics.qualifiedGapNextMonth
      : input.qualifiedGapNextMonth

    if (
      this.props.metrics.qualifiedGap === input.qualifiedGap
      && this.props.metrics.isQualifiedNextMonth === nextIsQualifiedNextMonth
      && this.props.metrics.qualifiedGapNextMonth === nextQualifiedGapNextMonth
    ) {
      return false
    }

    this.props.metrics.qualifiedGap = input.qualifiedGap
    this.props.metrics.isQualifiedNextMonth = nextIsQualifiedNextMonth
    this.props.metrics.qualifiedGapNextMonth = nextQualifiedGapNextMonth
    this.recordQualificationEvent(occurredAt)
    return true
  }

  refreshProjectedQualification(
    qualifiedGap: number,
    occurredAt = new Date(),
  ): boolean {
    if (this.props.metrics.qualifiedGap === qualifiedGap) {
      return false
    }

    this.props.metrics.qualifiedGap = qualifiedGap
    this.recordQualificationEvent(occurredAt)
    return true
  }

  toSnapshot(): ApmSnapshot {
    return {
      id: this.props.id,
      agentCode: this.props.agentCode,
      period: this.props.period,
      metrics: { ...this.props.metrics },
    }
  }

  private recordQualificationEvent(occurredAt: Date) {
    this.record({
      type: 'QualificationRecalculated',
      agentCode: this.props.agentCode,
      year: this.props.period.year,
      month: this.props.period.month,
      occurredAt,
    } satisfies QualificationRecalculated)
  }
}

function hasSameMetrics(left: StoredApmMetrics, right: StoredApmMetrics): boolean {
  return (
    left.nsc === right.nsc
    && left.nscSum === right.nscSum
    && left.netAfycSum === right.netAfycSum
    && left.netAfyp === right.netAfyp
    && left.netAfypSum === right.netAfypSum
    && left.netAfypAssigned === right.netAfypAssigned
    && left.netAfypAssignedSum === right.netAfypAssignedSum
    && left.nscHp === right.nscHp
    && left.nscHpSum === right.nscHpSum
    && left.netAfypHp === right.netAfypHp
    && left.netAfypHpSum === right.netAfypHpSum
    && left.netAfypH === right.netAfypH
    && left.netAfypHSum === right.netAfypHSum
    && left.netCaseH === right.netCaseH
    && left.netCaseHSum === right.netCaseHSum
    && left.netCase === right.netCase
    && left.netCaseSum === right.netCaseSum
    && left.netCaseAssigned === right.netCaseAssigned
    && left.netCaseAssignedSum === right.netCaseAssignedSum
    && left.isQualified === right.isQualified
    && left.isQualifiedAssigned === right.isQualifiedAssigned
    && left.renewalRateTeam === right.renewalRateTeam
    && left.qualifiedGap === right.qualifiedGap
    && left.isQualifiedNextMonth === right.isQualifiedNextMonth
    && left.qualifiedGapNextMonth === right.qualifiedGapNextMonth
  )
}
