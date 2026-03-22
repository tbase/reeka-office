import { revalidatePath } from "next/cache"

import {
  GetPlanQuery,
  ReorderPlanStagesCommand,
  ReorderPlanTasksCommand,
  type PlanDetailItem,
} from "@reeka-office/domain-plan"

export type PlanStageItem = PlanDetailItem["stages"][number]
export type PlanTaskItem = PlanStageItem["tasks"][number] & { stageId: number }

export async function getPlanOrThrow(planId: number): Promise<PlanDetailItem> {
  const plan = await new GetPlanQuery({ id: planId }).query()
  if (!plan) {
    throw new Error("计划不存在")
  }

  return plan
}

export async function assertPlanEditable(planId: number): Promise<PlanDetailItem> {
  const plan = await getPlanOrThrow(planId)
  if (plan.status === "archived") {
    throw new Error("已归档计划不可修改")
  }

  return plan
}

export function findStageOrThrow(
  plan: PlanDetailItem,
  stageId: number,
): PlanStageItem {
  const stage = plan.stages.find((item) => item.id === stageId)
  if (!stage) {
    throw new Error("计划阶段不存在")
  }

  return stage
}

export function findTaskOrThrow(
  plan: PlanDetailItem,
  taskId: number,
): PlanTaskItem {
  for (const stage of plan.stages) {
    const task = stage.tasks.find((item) => item.id === taskId)
    if (task) {
      return {
        ...task,
        stageId: stage.id,
      }
    }
  }

  throw new Error("计划任务不存在")
}

export function revalidatePlanPaths(planId?: number) {
  revalidatePath("/plans")
  if (planId) {
    revalidatePath(`/plans/${planId}`)
    revalidatePath(`/plans/${planId}/edit`)
  }
}

export function revalidatePlanTaskCategoryPaths() {
  revalidatePath("/plans")
  revalidatePath("/plans/task-categories")
}

export async function normalizeStageOrder(planId: number) {
  const plan = await getPlanOrThrow(planId)
  const orderedStageIds = plan.stages.map((stage) => stage.id)
  if (orderedStageIds.length <= 1) {
    return
  }

  await new ReorderPlanStagesCommand({
    planId,
    orderedStageIds,
  }).execute()
}

export async function normalizeTaskOrder(planId: number, stageId: number) {
  const plan = await getPlanOrThrow(planId)
  const stage = plan.stages.find((item) => item.id === stageId)
  if (!stage) {
    return
  }

  const orderedTaskIds = stage.tasks.map((task) => task.id)
  if (orderedTaskIds.length <= 1) {
    return
  }

  await new ReorderPlanTasksCommand({
    planId,
    stageId,
    orderedTaskIds,
  }).execute()
}

export function moveIdWithinList(ids: number[], currentId: number, offset: -1 | 1) {
  const index = ids.indexOf(currentId)
  if (index === -1) {
    throw new Error("排序对象不存在")
  }

  const nextIndex = index + offset
  if (nextIndex < 0 || nextIndex >= ids.length) {
    return ids
  }

  const nextIds = [...ids]
  ;[nextIds[index], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[index]]
  return nextIds
}
