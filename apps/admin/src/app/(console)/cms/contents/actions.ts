"use server"

import {
  CreateContentCommand,
  DeleteContentCommand,
  UpdateContentCommand,
} from "@reeka-office/domain-cms"
import { revalidatePath } from "next/cache"

import { getRequiredAdminContext } from "@/lib/admin-context"
import {
  getFormDataValues,
  parseJsonObject,
  parseOptionalId,
  parseRequiredId,
  parseRequiredText,
} from "@/lib/form-data"

const contentFieldNames = ["id", "categoryId", "name", "content", "fieldsJson"] as const

function parseContentInput(formData: FormData) {
  const fields = getFormDataValues(formData, contentFieldNames)

  return {
    id: parseOptionalId(fields.id, "无效内容 ID"),
    categoryId: parseRequiredId(fields.categoryId, "无效分类 ID"),
    name: parseRequiredText(fields.name, "标题"),
    content: String(fields.content ?? ""),
    fields: parseJsonObject(fields.fieldsJson),
  }
}

function parseContentId(formData: FormData): number {
  const { id } = getFormDataValues(formData, ["id"] as const)
  return parseRequiredId(id, "无效内容 ID")
}

export async function createContentAction(formData: FormData): Promise<{ success: true }> {
  await getRequiredAdminContext()
  const { categoryId, name, content, fields } = parseContentInput(formData)

  await new CreateContentCommand({
    categoryId,
    name,
    content,
    fields,
  }).execute()

  revalidatePath("/cms/contents")
  return { success: true }
}

export async function updateContentAction(formData: FormData): Promise<{ success: true }> {
  await getRequiredAdminContext()
  const { id, categoryId, name, content, fields } = parseContentInput(formData)

  await new UpdateContentCommand({
    id: parseRequiredId(id, "无效内容 ID"),
    categoryId,
    name,
    content,
    fields,
  }).execute()

  revalidatePath("/cms/contents")
  return { success: true }
}

export async function deleteContentAction(formData: FormData) {
  await getRequiredAdminContext()
  const id = parseContentId(formData)
  await new DeleteContentCommand({ id }).execute()

  revalidatePath("/cms/contents")
}
