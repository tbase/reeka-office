"use server"

import {
  ArchivePlanTaskCommand,
  CreatePlanTaskCommand,
  ReorderPlanTasksCommand,
  UpdatePlanTaskCommand,
} from "@reeka-office/domain-plan"

import {
  createPlanTaskActionSchema,
  updatePlanTaskActionSchema,
} from "@/actions/plans/form-schemas"
import {
  assertPlanEditable,
  findStageOrThrow,
  findTaskOrThrow,
  moveIdWithinList,
  normalizeTaskOrder,
  revalidatePlanPaths,
} from "@/actions/plans/helpers"
import { getFormDataValues, parseRequiredId } from "@/lib/form-data"
import { adminActionClient } from "@/lib/safe-action"

export const createPlanTaskAction = adminActionClient
  .inputSchema(createPlanTaskActionSchema)
  .action(async ({ parsedInput }) => {
    const plan = await assertPlanEditable(parsedInput.planId)
    findStageOrThrow(plan, parsedInput.stageId)

    await new CreatePlanTaskCommand({
      planId: parsedInput.planId,
      stageId: parsedInput.stageId,
      categoryId: parsedInput.categoryId,
      title: parsedInput.title,
      description: parsedInput.description,
      taskType: parsedInput.taskType,
      isRequired: parsedInput.taskType === "metric" ? true : parsedInput.isRequired,
      pointItemId: parsedInput.pointItemId,
    }).execute()

    await normalizeTaskOrder(parsedInput.planId, parsedInput.stageId)
    revalidatePlanPaths(parsedInput.planId)
    return { success: true }
  })

export const updatePlanTaskAction = adminActionClient
  .inputSchema(updatePlanTaskActionSchema)
  .action(async ({ parsedInput }) => {
    const plan = await assertPlanEditable(parsedInput.planId)
    const currentTask = findTaskOrThrow(plan, parsedInput.id)
    findStageOrThrow(plan, parsedInput.stageId)

    if (currentTask.status === "archived") {
      throw new Error("已归档任务不可修改")
    }

    const targetStage = findStageOrThrow(plan, parsedInput.stageId)
    const displayOrder = currentTask.stageId === parsedInput.stageId
      ? currentTask.displayOrder
      : targetStage.tasks.length

    await new UpdatePlanTaskCommand({
      id: parsedInput.id,
      planId: parsedInput.planId,
      stageId: parsedInput.stageId,
      categoryId: parsedInput.categoryId,
      title: parsedInput.title,
      description: parsedInput.description,
      displayOrder,
      taskType: parsedInput.taskType,
      isRequired: parsedInput.taskType === "metric" ? true : parsedInput.isRequired,
      pointItemId: parsedInput.pointItemId,
    }).execute()

    await normalizeTaskOrder(parsedInput.planId, currentTask.stageId)
    if (parsedInput.stageId !== currentTask.stageId) {
      await normalizeTaskOrder(parsedInput.planId, parsedInput.stageId)
    }

    revalidatePlanPaths(parsedInput.planId)
    return { success: true }
  })

export type CreatePlanTaskAction = typeof createPlanTaskAction
export type UpdatePlanTaskAction = typeof updatePlanTaskAction
export type PlanTaskFormAction = CreatePlanTaskAction | UpdatePlanTaskAction

export async function archivePlanTaskAction(formData: FormData) {
  const { id, planId } = getFormDataValues(formData, ["id", "planId"] as const)
  const taskId = parseRequiredId(id, "无效任务 ID")
  const parsedPlanId = parseRequiredId(planId, "无效计划 ID")

  const plan = await assertPlanEditable(parsedPlanId)
  const task = findTaskOrThrow(plan, taskId)

  if (task.status === "archived") {
    return
  }

  await new ArchivePlanTaskCommand({
    id: taskId,
    planId: parsedPlanId,
  }).execute()

  await normalizeTaskOrder(parsedPlanId, task.stageId)
  revalidatePlanPaths(parsedPlanId)
}

async function moveTask(formData: FormData, offset: -1 | 1) {
  const { id, planId, stageId } = getFormDataValues(
    formData,
    ["id", "planId", "stageId"] as const,
  )
  const taskId = parseRequiredId(id, "无效任务 ID")
  const parsedPlanId = parseRequiredId(planId, "无效计划 ID")
  const parsedStageId = parseRequiredId(stageId, "无效阶段 ID")

  const plan = await assertPlanEditable(parsedPlanId)
  const stage = findStageOrThrow(plan, parsedStageId)
  const task = findTaskOrThrow(plan, taskId)

  if (task.status === "archived") {
    throw new Error("已归档任务不可排序")
  }

  const orderedTaskIds = moveIdWithinList(
    stage.tasks.map((item) => item.id),
    taskId,
    offset,
  )

  await new ReorderPlanTasksCommand({
    planId: parsedPlanId,
    stageId: parsedStageId,
    orderedTaskIds,
  }).execute()

  revalidatePlanPaths(parsedPlanId)
}

export async function movePlanTaskUpAction(formData: FormData) {
  await moveTask(formData, -1)
}

export async function movePlanTaskDownAction(formData: FormData) {
  await moveTask(formData, 1)
}
