"use server"

import {
  CreatePlanStagesBatchCommand,
  DeletePlanStageCommand,
  ReorderPlanStagesCommand,
  UpdatePlanStageCommand,
} from "@reeka-office/domain-plan"

import {
  createPlanStageActionSchema,
  updatePlanStageActionSchema,
} from "@/actions/plans/form-schemas"
import {
  assertPlanEditable,
  findStageOrThrow,
  moveIdWithinList,
  normalizeStageOrder,
  revalidatePlanPaths,
} from "@/actions/plans/helpers"
import { getFormDataValues, parseRequiredId } from "@/lib/form-data"
import { adminActionClient } from "@/lib/safe-action"

export const createPlanStageAction = adminActionClient
  .inputSchema(createPlanStageActionSchema)
  .action(async ({ parsedInput }) => {
    await assertPlanEditable(parsedInput.planId)

    await new CreatePlanStagesBatchCommand({
      planId: parsedInput.planId,
      titles: parsedInput.titles,
    }).execute()

    await normalizeStageOrder(parsedInput.planId)
    revalidatePlanPaths(parsedInput.planId)
    return { success: true, createdCount: parsedInput.titles.length }
  })

export const updatePlanStageAction = adminActionClient
  .inputSchema(updatePlanStageActionSchema)
  .action(async ({ parsedInput }) => {
    const plan = await assertPlanEditable(parsedInput.planId)
    findStageOrThrow(plan, parsedInput.id)

    await new UpdatePlanStageCommand({
      id: parsedInput.id,
      planId: parsedInput.planId,
      title: parsedInput.title,
      description: parsedInput.description,
    }).execute()

    revalidatePlanPaths(parsedInput.planId)
    return { success: true }
  })

export type CreatePlanStageAction = typeof createPlanStageAction
export type UpdatePlanStageAction = typeof updatePlanStageAction
export type PlanStageFormAction = CreatePlanStageAction | UpdatePlanStageAction

export async function deletePlanStageAction(formData: FormData) {
  const { id, planId } = getFormDataValues(formData, ["id", "planId"] as const)
  const stageId = parseRequiredId(id, "无效阶段 ID")
  const parsedPlanId = parseRequiredId(planId, "无效计划 ID")

  const plan = await assertPlanEditable(parsedPlanId)
  findStageOrThrow(plan, stageId)

  await new DeletePlanStageCommand({
    id: stageId,
    planId: parsedPlanId,
  }).execute()

  await normalizeStageOrder(parsedPlanId)
  revalidatePlanPaths(parsedPlanId)
}

async function moveStage(formData: FormData, offset: -1 | 1) {
  const { id, planId } = getFormDataValues(formData, ["id", "planId"] as const)
  const stageId = parseRequiredId(id, "无效阶段 ID")
  const parsedPlanId = parseRequiredId(planId, "无效计划 ID")

  const plan = await assertPlanEditable(parsedPlanId)
  findStageOrThrow(plan, stageId)

  const orderedStageIds = moveIdWithinList(
    plan.stages.map((stage) => stage.id),
    stageId,
    offset,
  )

  await new ReorderPlanStagesCommand({
    planId: parsedPlanId,
    orderedStageIds,
  }).execute()

  revalidatePlanPaths(parsedPlanId)
}

export async function movePlanStageUpAction(formData: FormData) {
  await moveStage(formData, -1)
}

export async function movePlanStageDownAction(formData: FormData) {
  await moveStage(formData, 1)
}
