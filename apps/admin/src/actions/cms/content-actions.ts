"use server"

import {
  CreateContentCommand,
  DeleteContentCommand,
  UpdateContentCommand,
} from "@reeka-office/domain-cms"
import { revalidatePath } from "next/cache"

import {
  createContentActionSchema,
  updateContentActionSchema,
} from "@/actions/cms/form-schemas"
import { getFormDataValues, parseRequiredId } from "@/lib/form-data"
import { adminActionClient } from "@/lib/safe-action"

function parseContentId(formData: FormData): number {
  const { id } = getFormDataValues(formData, ["id"] as const)
  return parseRequiredId(id, "无效内容 ID")
}

export const createContentAction = adminActionClient
  .inputSchema(createContentActionSchema)
  .action(async ({ parsedInput }) => {
    await new CreateContentCommand({
      categoryId: parsedInput.categoryId,
      name: parsedInput.name,
      content: parsedInput.content,
      fields: parsedInput.fields,
    }).execute()

    revalidatePath("/cms/contents")

    return { success: true }
  })

export const updateContentAction = adminActionClient
  .inputSchema(updateContentActionSchema)
  .action(async ({ parsedInput }) => {
    await new UpdateContentCommand({
      id: parsedInput.id,
      categoryId: parsedInput.categoryId,
      name: parsedInput.name,
      content: parsedInput.content,
      fields: parsedInput.fields,
    }).execute()

    revalidatePath("/cms/contents")

    return { success: true }
  })

export type CreateContentAction = typeof createContentAction
export type UpdateContentAction = typeof updateContentAction
export type ContentFormAction = CreateContentAction | UpdateContentAction

export async function deleteContentAction(formData: FormData) {
  const id = parseContentId(formData)
  await new DeleteContentCommand({ id }).execute()

  revalidatePath("/cms/contents")
}
