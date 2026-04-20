import { and, eq, inArray, sql } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import { Apm } from '../domain/apm'
import type { Period } from '../domain/period'
import type { ApmRepository } from '../domain/repositories'
import { apm, type NewApmRow } from '../schema'

export class DrizzleApmRepository implements ApmRepository {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async findByKeys(keys: Array<{ agentCode: string; period: Period }>): Promise<Apm[]> {
    if (keys.length === 0) {
      return []
    }

    const rows = await this.db
      .select()
      .from(apm)
      .where(and(
        inArray(apm.agentCode, [...new Set(keys.map((key) => key.agentCode))]),
        inArray(apm.year, [...new Set(keys.map((key) => key.period.year))]),
        inArray(apm.month, [...new Set(keys.map((key) => key.period.month))]),
      ))

    return rows.map((row) => Apm.restore({
      id: row.id,
      agentCode: row.agentCode,
      period: {
        year: row.year,
        month: row.month,
      },
      metrics: {
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
        qualifiedGap: row.qualifiedGap,
        isQualifiedNextMonth: row.isQualifiedNextMonth,
        qualifiedGapNextMonth: row.qualifiedGapNextMonth,
      },
    }))
  }

  async save(entity: Apm): Promise<void> {
    const snapshot = entity.toSnapshot()
    const values: NewApmRow = {
      agentCode: snapshot.agentCode,
      year: snapshot.period.year,
      month: snapshot.period.month,
      nsc: snapshot.metrics.nsc,
      nscSum: snapshot.metrics.nscSum,
      netAfycSum: snapshot.metrics.netAfycSum,
      netAfyp: snapshot.metrics.netAfyp,
      netAfypSum: snapshot.metrics.netAfypSum,
      netAfypAssigned: snapshot.metrics.netAfypAssigned,
      netAfypAssignedSum: snapshot.metrics.netAfypAssignedSum,
      nscHp: snapshot.metrics.nscHp,
      nscHpSum: snapshot.metrics.nscHpSum,
      netAfypHp: snapshot.metrics.netAfypHp,
      netAfypHpSum: snapshot.metrics.netAfypHpSum,
      netAfypH: snapshot.metrics.netAfypH,
      netAfypHSum: snapshot.metrics.netAfypHSum,
      netCaseH: snapshot.metrics.netCaseH,
      netCaseHSum: snapshot.metrics.netCaseHSum,
      netCase: snapshot.metrics.netCase,
      netCaseSum: snapshot.metrics.netCaseSum,
      netCaseAssigned: snapshot.metrics.netCaseAssigned,
      netCaseAssignedSum: snapshot.metrics.netCaseAssignedSum,
      isQualified: snapshot.metrics.isQualified,
      isQualifiedAssigned: snapshot.metrics.isQualifiedAssigned,
      renewalRateTeam: snapshot.metrics.renewalRateTeam,
      qualifiedGap: snapshot.metrics.qualifiedGap,
      isQualifiedNextMonth: snapshot.metrics.isQualifiedNextMonth,
      qualifiedGapNextMonth: snapshot.metrics.qualifiedGapNextMonth,
    }

    if (snapshot.id == null) {
      const result = await this.db.insert(apm).values(values).$returningId()
      const id = result[0]?.id
      if (id != null) {
        entity.assignId(id)
      }
      return
    }

    await this.db
      .update(apm)
      .set({
        ...values,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(apm.id, snapshot.id))
  }
}
