import { and, eq, inArray } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import {
  getPlanEnrollmentPersistenceState,
  PlanEnrollment,
} from '../domain/enrollment/plan-enrollment'
import type { PlanEnrollmentRepository } from '../domain/repositories'
import {
  planCompletedTasks,
  planEnrollments,
  type NewPlanCompletedTaskRow,
  type NewPlanEnrollmentRow,
} from '../schema'

export class DrizzlePlanEnrollmentRepository implements PlanEnrollmentRepository {
  constructor(private readonly db: DBExecutor) { }

  async findById(enrollmentId: number): Promise<PlanEnrollment | null> {
    const [root] = await this.db
      .select()
      .from(planEnrollments)
      .where(eq(planEnrollments.id, enrollmentId))
      .limit(1)

    if (!root) {
      return null
    }

    const completedRows = await this.db
      .select()
      .from(planCompletedTasks)
      .where(eq(planCompletedTasks.enrollmentId, enrollmentId))

    return PlanEnrollment.restore({
      root: {
        id: root.id,
        planId: root.planId,
        agentId: root.agentId,
        status: root.status,
        assignedAt: root.assignedAt,
        startedAt: root.startedAt,
        eligibleAt: root.eligibleAt,
        graduatedAt: root.graduatedAt,
        cancelledAt: root.cancelledAt,
      },
      completedTasks: completedRows.map((row) => ({
        id: row.id,
        enrollmentId: row.enrollmentId,
        taskId: row.taskId,
        completionMode: row.completionMode,
        completedAt: row.completedAt,
        evidence: row.evidenceJson,
        remark: row.remark,
      })),
    })
  }

  async findByPlanAndAgent(planId: number, agentId: number): Promise<PlanEnrollment | null> {
    const [root] = await this.db
      .select()
      .from(planEnrollments)
      .where(
        and(
          eq(planEnrollments.planId, planId),
          eq(planEnrollments.agentId, agentId),
        ),
      )
      .limit(1)

    if (!root) {
      return null
    }

    return this.findById(root.id)
  }

  async listRecalculableByPlan(planId: number): Promise<PlanEnrollment[]> {
    const rows = await this.db
      .select()
      .from(planEnrollments)
      .where(
        and(
          eq(planEnrollments.planId, planId),
          inArray(planEnrollments.status, ['active', 'eligible']),
        ),
      )

    if (rows.length === 0) {
      return []
    }

    const enrollmentIds = rows.map((row) => row.id)
    const completedRows = await this.db
      .select()
      .from(planCompletedTasks)
      .where(inArray(planCompletedTasks.enrollmentId, enrollmentIds))

    const completedByEnrollmentId = new Map<number, typeof completedRows>()
    for (const completedRow of completedRows) {
      const group = completedByEnrollmentId.get(completedRow.enrollmentId) ?? []
      group.push(completedRow)
      completedByEnrollmentId.set(completedRow.enrollmentId, group)
    }

    return rows.map((row) => PlanEnrollment.restore({
      root: {
        id: row.id,
        planId: row.planId,
        agentId: row.agentId,
        status: row.status,
        assignedAt: row.assignedAt,
        startedAt: row.startedAt,
        eligibleAt: row.eligibleAt,
        graduatedAt: row.graduatedAt,
        cancelledAt: row.cancelledAt,
      },
      completedTasks: (completedByEnrollmentId.get(row.id) ?? []).map((item) => ({
        id: item.id,
        enrollmentId: item.enrollmentId,
        taskId: item.taskId,
        completionMode: item.completionMode,
        completedAt: item.completedAt,
        evidence: item.evidenceJson,
        remark: item.remark,
      })),
    }))
  }

  async save(enrollment: PlanEnrollment): Promise<void> {
    const snapshot = enrollment.toSnapshot()
    const persistenceState = getPlanEnrollmentPersistenceState(enrollment)

    if (!snapshot.root.id) {
      const values: NewPlanEnrollmentRow = {
        planId: snapshot.root.planId,
        agentId: snapshot.root.agentId,
        status: snapshot.root.status,
        assignedAt: snapshot.root.assignedAt,
        startedAt: snapshot.root.startedAt,
        eligibleAt: snapshot.root.eligibleAt,
        graduatedAt: snapshot.root.graduatedAt,
        cancelledAt: snapshot.root.cancelledAt,
      }

      const result = await this.db.insert(planEnrollments).values(values).$returningId()
      const enrollmentId = result[0]?.id
      if (!enrollmentId) {
        throw new Error('创建计划实例失败')
      }

      enrollment.assignId(enrollmentId)
    } else {
      await this.db
        .update(planEnrollments)
        .set({
          status: snapshot.root.status,
          assignedAt: snapshot.root.assignedAt,
          startedAt: snapshot.root.startedAt,
          eligibleAt: snapshot.root.eligibleAt,
          graduatedAt: snapshot.root.graduatedAt,
          cancelledAt: snapshot.root.cancelledAt,
        })
        .where(eq(planEnrollments.id, snapshot.root.id))
    }

    for (const completedTask of persistenceState.completedTasks) {
      const completedSnapshot = completedTask.toSnapshot()
      if (completedSnapshot.id) {
        continue
      }

      const values: NewPlanCompletedTaskRow = {
        enrollmentId: enrollment.id!,
        taskId: completedSnapshot.taskId,
        completionMode: completedSnapshot.completionMode,
        completedAt: completedSnapshot.completedAt,
        evidenceJson: completedSnapshot.evidence,
        remark: completedSnapshot.remark,
      }

      const result = await this.db.insert(planCompletedTasks).values(values).$returningId()
      const completedTaskId = result[0]?.id
      if (!completedTaskId) {
        throw new Error('创建任务完成记录失败')
      }

      completedTask.assignId(completedTaskId)
      completedTask.assignEnrollmentId(enrollment.id!)
    }
  }
}
