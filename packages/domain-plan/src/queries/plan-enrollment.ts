import { and, asc, eq, inArray } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import {
  planCompletedTasks,
  planEnrollments,
  plans,
} from '../schema'

export interface GetPlanEnrollmentInput {
  id: number
}

export interface PlanEnrollmentDetailItem {
  id: number
  planId: number
  planName: string
  agentCode: string
  status: 'active' | 'eligible' | 'graduated' | 'cancelled'
  assignedAt: Date
  startedAt: Date
  eligibleAt: Date | null
  graduatedAt: Date | null
  cancelledAt: Date | null
  completedTaskIds: number[]
}

export class GetPlanEnrollmentQuery {
  private readonly db: DB

  constructor(private readonly input: GetPlanEnrollmentInput) {
    this.db = getDb()
  }

  async query(): Promise<PlanEnrollmentDetailItem | null> {
    const [row] = await this.db
      .select({
        id: planEnrollments.id,
        planId: planEnrollments.planId,
        planName: plans.name,
        agentCode: planEnrollments.agentCode,
        status: planEnrollments.status,
        assignedAt: planEnrollments.assignedAt,
        startedAt: planEnrollments.startedAt,
        eligibleAt: planEnrollments.eligibleAt,
        graduatedAt: planEnrollments.graduatedAt,
        cancelledAt: planEnrollments.cancelledAt,
      })
      .from(planEnrollments)
      .innerJoin(plans, eq(plans.id, planEnrollments.planId))
      .where(eq(planEnrollments.id, this.input.id))
      .limit(1)

    if (!row) {
      return null
    }

    const completedRows = await this.db
      .select({ taskId: planCompletedTasks.taskId })
      .from(planCompletedTasks)
      .where(eq(planCompletedTasks.enrollmentId, row.id))

    return {
      ...row,
      completedTaskIds: completedRows.map((item) => item.taskId),
    }
  }
}

export interface ListPlanEnrollmentsInput {
  planId?: number
  agentCode?: string
  statuses?: Array<'active' | 'eligible' | 'graduated' | 'cancelled'>
}

export class ListPlanEnrollmentsQuery {
  private readonly db: DB

  constructor(private readonly input: ListPlanEnrollmentsInput = {}) {
    this.db = getDb()
  }

  async query() {
    const conditions = []
    if (this.input.planId) {
      conditions.push(eq(planEnrollments.planId, this.input.planId))
    }

    if (this.input.agentCode) {
      conditions.push(eq(planEnrollments.agentCode, this.input.agentCode))
    }

    if (this.input.statuses && this.input.statuses.length > 0) {
      conditions.push(inArray(planEnrollments.status, this.input.statuses))
    }

    const whereClause = conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions)

    const query = this.db
      .select({
        id: planEnrollments.id,
        planId: planEnrollments.planId,
        planName: plans.name,
        agentCode: planEnrollments.agentCode,
        status: planEnrollments.status,
        assignedAt: planEnrollments.assignedAt,
        startedAt: planEnrollments.startedAt,
        eligibleAt: planEnrollments.eligibleAt,
        graduatedAt: planEnrollments.graduatedAt,
        cancelledAt: planEnrollments.cancelledAt,
      })
      .from(planEnrollments)
      .innerJoin(plans, eq(plans.id, planEnrollments.planId))
      .orderBy(asc(planEnrollments.id))

    return whereClause ? query.where(whereClause) : query
  }
}
