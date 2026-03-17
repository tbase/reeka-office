"use server"

import {
  CreateCategoryCommand,
  DeleteCategoryCommand,
  UpdateCategoryCommand,
  type FieldSchemaItem,
} from "@reeka-office/domain-cms"
import { revalidatePath } from "next/cache"

import { getRequiredAdminContext } from "@/lib/admin-context"
import { getFormDataValues, parseRequiredId } from "@/lib/form-data"

export type CategoryActionInput = {
  id?: number
  name: string
  slug: string
  description: string
  hideContent: boolean
  fieldSchema: FieldSchemaItem[]
}

export async function createCategoryAction(data: CategoryActionInput): Promise<{ success: true }> {
  await getRequiredAdminContext()
  const name = data.name.trim()
  const slug = data.slug.trim()
  const description = data.description.trim()

  if (!name) {
    throw new Error("分类名称不能为空")
  }

  await new CreateCategoryCommand({
    name,
    slug: slug || undefined,
    description: description || null,
    hideContent: data.hideContent,
    fieldSchema: data.fieldSchema,
  }).execute()

  revalidatePath("/cms/categories")
  revalidatePath("/cms/contents")
  return { success: true }
}

export async function updateCategoryAction(data: CategoryActionInput): Promise<{ success: true }> {
  await getRequiredAdminContext()
  if (!data.id || !Number.isInteger(data.id) || data.id <= 0) {
    throw new Error("无效分类 ID")
  }

  const name = data.name.trim()
  const slug = data.slug.trim()
  const description = data.description.trim()

  if (!name) {
    throw new Error("分类名称不能为空")
  }

  await new UpdateCategoryCommand({
    id: data.id,
    name,
    slug: slug || undefined,
    description: description || null,
    hideContent: data.hideContent,
    fieldSchema: data.fieldSchema,
  }).execute()

  revalidatePath("/cms/categories")
  revalidatePath("/cms/contents")
  return { success: true }
}

export async function deleteCategoryAction(formData: FormData) {
  await getRequiredAdminContext()
  const { id } = getFormDataValues(formData, ["id"] as const)
  await new DeleteCategoryCommand({ id: parseRequiredId(id, "无效分类 ID") }).execute()

  revalidatePath("/cms/categories")
  revalidatePath("/cms/contents")
}
