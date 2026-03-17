import { and, asc, eq, inArray } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import type { TenantScope } from '../scope'
import {
  plans,
  planStages,
  planTasks,
  planTaskCategories,
} from '../schema'

export interface ListPlansInput {
  statuses?: Array<'draft' | 'published' | 'archived'>
}

export interface PlanDetailItem {
  id: number
  name: string
  description: string | null
  status: 'draft' | 'published' | 'archived'
  createdBy: number
  createdAt: Date
  updatedAt: Date
  stages: Array<{
    id: number
    title: string
    description: string | null
    displayOrder: number
    tasks: Array<{
      id: number
      title: string
      description: string | null
      displayOrder: number
      taskType: 'normal' | 'metric'
      isRequired: boolean
      status: 'active' | 'archived'
      pointItemId: number | null
      categoryId: number
      categoryName: string
    }>
  }>
}

export class ListPlansQuery {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: ListPlansInput

  constructor(scope: TenantScope, input: ListPlansInput = {}) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query() {
    const query = this.db
      .select()
      .from(plans)
      .where(eq(plans.tenantId, this.scope.tenantId))
      .orderBy(asc(plans.createdAt), asc(plans.id))

    if (!this.input.statuses || this.input.statuses.length === 0) {
      return query
    }

    return this.db
      .select()
      .from(plans)
      .where(and(
        eq(plans.tenantId, this.scope.tenantId),
        inArray(plans.status, this.input.statuses),
      ))
      .orderBy(asc(plans.createdAt), asc(plans.id))
  }
}

export interface GetPlanInput {
  id: number
}

export class GetPlanQuery {
  private readonly db: DB
  private readonly scope: TenantScope
  private readonly input: GetPlanInput

  constructor(scope: TenantScope, input: GetPlanInput) {
    this.db = getDb()
    this.scope = scope
    this.input = input
  }

  async query(): Promise<PlanDetailItem | null> {
    const [plan] = await this.db
      .select()
      .from(plans)
      .where(and(
        eq(plans.tenantId, this.scope.tenantId),
        eq(plans.id, this.input.id),
      ))
      .limit(1)

    if (!plan) {
      return null
    }

    const [stageRows, taskRows] = await Promise.all([
      this.db
        .select()
        .from(planStages)
        .where(and(
          eq(planStages.tenantId, this.scope.tenantId),
          eq(planStages.planId, this.input.id),
        ))
        .orderBy(asc(planStages.displayOrder), asc(planStages.id)),
      this.db
        .select({
          id: planTasks.id,
          planId: planTasks.planId,
          stageId: planTasks.stageId,
          categoryId: planTasks.categoryId,
          title: planTasks.title,
          description: planTasks.description,
          displayOrder: planTasks.displayOrder,
          taskType: planTasks.taskType,
          isRequired: planTasks.isRequired,
          status: planTasks.status,
          pointItemId: planTasks.pointItemId,
          categoryName: planTaskCategories.name,
        })
        .from(planTasks)
        .innerJoin(planTaskCategories, and(
          eq(planTaskCategories.id, planTasks.categoryId),
          eq(planTaskCategories.tenantId, this.scope.tenantId),
        ))
        .where(and(
          eq(planTasks.tenantId, this.scope.tenantId),
          eq(planTasks.planId, this.input.id),
        ))
        .orderBy(asc(planTasks.stageId), asc(planTasks.displayOrder), asc(planTasks.id)),
    ])

    const tasksByStageId = new Map<number, PlanDetailItem['stages'][number]['tasks']>()
    for (const task of taskRows) {
      const list = tasksByStageId.get(task.stageId) ?? []
      list.push({
        id: task.id,
        title: task.title,
        description: task.description,
        displayOrder: task.displayOrder,
        taskType: task.taskType,
        isRequired: task.isRequired,
        status: task.status,
        pointItemId: task.pointItemId,
        categoryId: task.categoryId,
        categoryName: task.categoryName,
      })
      tasksByStageId.set(task.stageId, list)
    }

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      status: plan.status,
      createdBy: plan.createdBy,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      stages: stageRows.map((stage) => ({
        id: stage.id,
        title: stage.title,
        description: stage.description,
        displayOrder: stage.displayOrder,
        tasks: tasksByStageId.get(stage.id) ?? [],
      })),
    }
  }
}
