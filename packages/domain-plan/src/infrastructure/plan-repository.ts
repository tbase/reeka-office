import { and, eq } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import type { PlanRepository, PlanTaskLookup } from '../domain/repositories'
import { getPlanPersistenceState, Plan } from '../domain/plan/plan'
import { PlanTask } from '../domain/plan/plan-task'
import {
  plans,
  planStages,
  planTasks,
  type NewPlanRow,
  type NewPlanStageRow,
  type NewPlanTaskRow,
} from '../schema'

export class DrizzlePlanRepository implements PlanRepository, PlanTaskLookup {
  constructor(private readonly db: DBExecutor) {}

  async findById(planId: number): Promise<Plan | null> {
    const [root] = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1)

    if (!root) {
      return null
    }

    const [stageRows, taskRows] = await Promise.all([
      this.db
        .select()
        .from(planStages)
        .where(eq(planStages.planId, planId)),
      this.db
        .select()
        .from(planTasks)
        .where(eq(planTasks.planId, planId)),
    ])

    return Plan.restore({
      root: {
        id: root.id,
        name: root.name,
        description: root.description,
        status: root.status,
        createdBy: root.createdBy,
      },
      stages: stageRows.map((row) => ({
        id: row.id,
        planId: row.planId,
        title: row.title,
        description: row.description,
        displayOrder: row.displayOrder,
      })),
      tasks: taskRows.map((row) => ({
        id: row.id,
        planId: row.planId,
        stageId: row.stageId,
        categoryId: row.categoryId,
        title: row.title,
        description: row.description,
        displayOrder: row.displayOrder,
        taskType: row.taskType,
        isRequired: row.isRequired,
        status: row.status,
        pointItemId: row.pointItemId,
      })),
    })
  }

  async findTaskById(taskId: number): Promise<PlanTask | null> {
    const [row] = await this.db
      .select()
      .from(planTasks)
      .where(eq(planTasks.id, taskId))
      .limit(1)

    if (!row) {
      return null
    }

    return PlanTask.restore({
      id: row.id,
      planId: row.planId,
      stageId: row.stageId,
      categoryId: row.categoryId,
      title: row.title,
      description: row.description,
      displayOrder: row.displayOrder,
      taskType: row.taskType,
      isRequired: row.isRequired,
      status: row.status,
      pointItemId: row.pointItemId,
    })
  }

  async existsByName(name: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.name, name.trim()))
      .limit(1)

    return Boolean(rows[0]?.id)
  }

  async save(plan: Plan): Promise<void> {
    const snapshot = plan.toSnapshot()
    const persistenceState = getPlanPersistenceState(plan)

    if (!snapshot.root.id) {
      const values: NewPlanRow = {
        name: snapshot.root.name,
        description: snapshot.root.description,
        status: snapshot.root.status,
        createdBy: snapshot.root.createdBy,
      }

      const result = await this.db.insert(plans).values(values).$returningId()
      const planId = result[0]?.id
      if (!planId) {
        throw new Error('创建计划失败')
      }

      plan.assignId(planId)
      return
    }

    await this.db
      .update(plans)
      .set({
        name: snapshot.root.name,
        description: snapshot.root.description,
        status: snapshot.root.status,
      })
      .where(eq(plans.id, snapshot.root.id))

    const existingStageRows = await this.db
      .select({ id: planStages.id })
      .from(planStages)
      .where(eq(planStages.planId, snapshot.root.id))

    const currentStageIds = new Set<number>()
    for (const stage of persistenceState.stages) {
      const stageSnapshot = stage.toSnapshot()

      if (!stageSnapshot.id) {
        const values: NewPlanStageRow = {
          planId: snapshot.root.id,
          title: stageSnapshot.title,
          description: stageSnapshot.description,
          displayOrder: stageSnapshot.displayOrder,
        }

        const result = await this.db.insert(planStages).values(values).$returningId()
        const stageId = result[0]?.id
        if (!stageId) {
          throw new Error('创建计划阶段失败')
        }

        stage.assignId(stageId)
        currentStageIds.add(stageId)
        continue
      }

      currentStageIds.add(stageSnapshot.id)
      await this.db
        .update(planStages)
        .set({
          title: stageSnapshot.title,
          description: stageSnapshot.description,
          displayOrder: stageSnapshot.displayOrder,
        })
        .where(eq(planStages.id, stageSnapshot.id))
    }

    for (const existingStage of existingStageRows) {
      if (!currentStageIds.has(existingStage.id)) {
        await this.db.delete(planTasks).where(eq(planTasks.stageId, existingStage.id))
        await this.db.delete(planStages).where(eq(planStages.id, existingStage.id))
      }
    }

    const existingTaskRows = await this.db
      .select({ id: planTasks.id })
      .from(planTasks)
      .where(eq(planTasks.planId, snapshot.root.id))

    const currentTaskIds = new Set<number>()
    for (const task of persistenceState.tasks) {
      const taskSnapshot = task.toSnapshot()

      if (!taskSnapshot.id) {
        const values: NewPlanTaskRow = {
          planId: snapshot.root.id,
          stageId: taskSnapshot.stageId,
          categoryId: taskSnapshot.categoryId,
          title: taskSnapshot.title,
          description: taskSnapshot.description,
          displayOrder: taskSnapshot.displayOrder,
          taskType: taskSnapshot.taskType,
          isRequired: taskSnapshot.isRequired,
          status: taskSnapshot.status,
          pointItemId: taskSnapshot.pointItemId,
        }

        const result = await this.db.insert(planTasks).values(values).$returningId()
        const taskId = result[0]?.id
        if (!taskId) {
          throw new Error('创建计划任务失败')
        }

        task.assignId(taskId)
        currentTaskIds.add(taskId)
        continue
      }

      currentTaskIds.add(taskSnapshot.id)
      await this.db
        .update(planTasks)
        .set({
          stageId: taskSnapshot.stageId,
          categoryId: taskSnapshot.categoryId,
          title: taskSnapshot.title,
          description: taskSnapshot.description,
          displayOrder: taskSnapshot.displayOrder,
          taskType: taskSnapshot.taskType,
          isRequired: taskSnapshot.isRequired,
          status: taskSnapshot.status,
          pointItemId: taskSnapshot.pointItemId,
        })
        .where(eq(planTasks.id, taskSnapshot.id))
    }

    for (const existingTask of existingTaskRows) {
      if (!currentTaskIds.has(existingTask.id)) {
        await this.db.delete(planTasks).where(eq(planTasks.id, existingTask.id))
      }
    }
  }
}
