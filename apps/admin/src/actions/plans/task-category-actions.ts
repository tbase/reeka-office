"use server"

import {
  CreatePlanTaskCategoriesBatchCommand,
  DisablePlanTaskCategoryCommand,
  UpdatePlanTaskCategoryCommand,
  ListPlanTaskCategoriesQuery,
} from "@reeka-office/domain-plan"

import {
  createPlanTaskCategoryActionSchema,
  updatePlanTaskCategoryActionSchema,
} from "@/actions/plans/form-schemas"
import { revalidatePlanTaskCategoryPaths } from "@/actions/plans/helpers"
import { getFormDataValues, parseRequiredId } from "@/lib/form-data"
import { adminActionClient } from "@/lib/safe-action"

export const createPlanTaskCategoryAction = adminActionClient
  .inputSchema(createPlanTaskCategoryActionSchema)
  .action(async ({ parsedInput }) => {
    await new CreatePlanTaskCategoriesBatchCommand({
      names: parsedInput.names,
    }).execute()

    revalidatePlanTaskCategoryPaths()
    return { success: true, createdCount: parsedInput.names.length }
  })

export const updatePlanTaskCategoryAction = adminActionClient
  .inputSchema(updatePlanTaskCategoryActionSchema)
  .action(async ({ parsedInput }) => {
    const categories = await new ListPlanTaskCategoriesQuery({ includeInactive: true }).query()
    const currentCategory = categories.find((category) => category.id === parsedInput.id)

    if (!currentCategory) {
      throw new Error("任务分类不存在")
    }

    await new UpdatePlanTaskCategoryCommand({
      id: parsedInput.id,
      name: parsedInput.name,
      description: currentCategory.description,
      displayOrder: currentCategory.displayOrder,
    }).execute()

    revalidatePlanTaskCategoryPaths()
    return { success: true }
  })

export type CreatePlanTaskCategoryAction = typeof createPlanTaskCategoryAction
export type UpdatePlanTaskCategoryAction = typeof updatePlanTaskCategoryAction
export type PlanTaskCategoryFormAction =
  | CreatePlanTaskCategoryAction
  | UpdatePlanTaskCategoryAction

export async function disablePlanTaskCategoryAction(formData: FormData) {
  const { id } = getFormDataValues(formData, ["id"] as const)
  const categoryId = parseRequiredId(id, "无效任务分类 ID")

  await new DisablePlanTaskCategoryCommand({
    id: categoryId,
  }).execute()

  revalidatePlanTaskCategoryPaths()
}
