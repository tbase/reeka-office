import { and, asc, eq, inArray } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import type { TenantScope } from '../scope'
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
  agentId: number
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
  private readonly scope: TenantScope
  private readonly input: GetPlanEnrollmentInput

  constructor(scope: TenantScope, input: GetPlanEnrollmentInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query(): Promise<PlanEnrollmentDetailItem | null> {
    const [row] = await this.db
      .select({
        id: planEnrollments.id,
        planId: planEnrollments.planId,
        planName: plans.name,
        agentId: planEnrollments.agentId,
        status: planEnrollments.status,
        assignedAt: planEnrollments.assignedAt,
        startedAt: planEnrollments.startedAt,
        eligibleAt: planEnrollments.eligibleAt,
        graduatedAt: planEnrollments.graduatedAt,
        cancelledAt: planEnrollments.cancelledAt,
      })
      .from(planEnrollments)
      .innerJoin(plans, eq(plans.id, planEnrollments.planId))
      .where(and(
        eq(planEnrollments.tenantId, this.scope.tenantId),
        eq(planEnrollments.id, this.input.id),
      ))
      .limit(1)

    if (!row) {
      return null
    }

    const completedRows = await this.db
      .select({ taskId: planCompletedTasks.taskId })
      .from(planCompletedTasks)
      .where(and(
        eq(planCompletedTasks.tenantId, this.scope.tenantId),
        eq(planCompletedTasks.enrollmentId, row.id),
      ))

    return {
      ...row,
      completedTaskIds: completedRows.map((item) => item.taskId),
    }
  }
}

export interface ListPlanEnrollmentsInput {
  planId?: number
  agentId?: number
  statuses?: Array<'active' | 'eligible' | 'graduated' | 'cancelled'>
}

export class ListPlanEnrollmentsQuery {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: ListPlanEnrollmentsInput

  constructor(scope: TenantScope, input: ListPlanEnrollmentsInput = {}) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query() {
    const conditions = [eq(planEnrollments.tenantId, this.scope.tenantId)]
    if (this.input.planId) {
      conditions.push(eq(planEnrollments.planId, this.input.planId))
    }

    if (this.input.agentId) {
      conditions.push(eq(planEnrollments.agentId, this.input.agentId))
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
        agentId: planEnrollments.agentId,
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
