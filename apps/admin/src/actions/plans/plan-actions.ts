"use server"

import {
  ArchivePlanCommand,
  CreatePlanCommand,
  PublishPlanCommand,
  UpdatePlanCommand,
} from "@reeka-office/domain-plan"

import {
  createPlanActionSchema,
  updatePlanActionSchema,
} from "@/actions/plans/form-schemas"
import {
  assertPlanEditable,
  revalidatePlanPaths,
} from "@/actions/plans/helpers"
import { getFormDataValues, parseRequiredId } from "@/lib/form-data"
import { adminActionClient } from "@/lib/safe-action"

const DEFAULT_OPERATOR_ID = 1

export const createPlanAction = adminActionClient
  .inputSchema(createPlanActionSchema)
  .action(async ({ parsedInput }) => {
    const planId = await new CreatePlanCommand({
      name: parsedInput.name,
      description: parsedInput.description,
      createdBy: DEFAULT_OPERATOR_ID,
    }).execute()

    revalidatePlanPaths(planId ?? undefined)
    return { success: true, planId }
  })

export const updatePlanAction = adminActionClient
  .inputSchema(updatePlanActionSchema)
  .action(async ({ parsedInput }) => {
    await assertPlanEditable(parsedInput.id)

    await new UpdatePlanCommand({
      id: parsedInput.id,
      name: parsedInput.name,
      description: parsedInput.description,
    }).execute()

    revalidatePlanPaths(parsedInput.id)
    return { success: true }
  })

export type CreatePlanAction = typeof createPlanAction
export type UpdatePlanAction = typeof updatePlanAction
export type PlanFormAction = CreatePlanAction | UpdatePlanAction

export async function publishPlanAction(formData: FormData) {
  const { id } = getFormDataValues(formData, ["id"] as const)
  const planId = parseRequiredId(id, "无效计划 ID")

  await new PublishPlanCommand({ id: planId }).execute()
  revalidatePlanPaths(planId)
}

export async function archivePlanAction(formData: FormData) {
  const { id } = getFormDataValues(formData, ["id"] as const)
  const planId = parseRequiredId(id, "无效计划 ID")

  await new ArchivePlanCommand({ id: planId }).execute()
  revalidatePlanPaths(planId)
}
