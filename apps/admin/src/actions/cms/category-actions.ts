"use server"

import {
  CreateCategoryCommand,
  DeleteCategoryCommand,
  UpdateCategoryCommand,
} from "@reeka-office/domain-cms"
import { revalidatePath } from "next/cache"

import {
  createCategoryActionSchema,
  updateCategoryActionSchema,
} from "@/actions/cms/form-schemas"
import { getFormDataValues, parseRequiredId } from "@/lib/form-data"
import { adminActionClient } from "@/lib/safe-action"

export const createCategoryAction = adminActionClient
  .inputSchema(createCategoryActionSchema)
  .action(async ({ parsedInput }) => {
    await new CreateCategoryCommand({
      name: parsedInput.name,
      slug: parsedInput.slug || undefined,
      description: parsedInput.description,
      hideContent: parsedInput.hideContent,
      fieldSchema: parsedInput.fieldSchema,
    }).execute()

    revalidatePath("/cms/categories")
    revalidatePath("/cms/contents")

    return { success: true }
  })

export const updateCategoryAction = adminActionClient
  .inputSchema(updateCategoryActionSchema)
  .action(async ({ parsedInput }) => {
    await new UpdateCategoryCommand({
      id: parsedInput.id,
      name: parsedInput.name,
      slug: parsedInput.slug || undefined,
      description: parsedInput.description,
      hideContent: parsedInput.hideContent,
      fieldSchema: parsedInput.fieldSchema,
    }).execute()

    revalidatePath("/cms/categories")
    revalidatePath("/cms/contents")

    return { success: true }
  })

export type CreateCategoryAction = typeof createCategoryAction
export type UpdateCategoryAction = typeof updateCategoryAction
export type CategoryFormAction = CreateCategoryAction | UpdateCategoryAction

export async function deleteCategoryAction(formData: FormData) {
  const { id } = getFormDataValues(formData, ["id"] as const)
  await new DeleteCategoryCommand({ id: parseRequiredId(id, "无效分类 ID") }).execute()

  revalidatePath("/cms/categories")
  revalidatePath("/cms/contents")
}
