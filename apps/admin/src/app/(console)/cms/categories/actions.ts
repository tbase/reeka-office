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
  const ctx = await getRequiredAdminContext()
  const name = data.name.trim()
  const slug = data.slug.trim()
  const description = data.description.trim()

  if (!name) {
    throw new Error("分类名称不能为空")
  }

  await new CreateCategoryCommand(ctx, {
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
  const ctx = await getRequiredAdminContext()
  if (!data.id || !Number.isInteger(data.id) || data.id <= 0) {
    throw new Error("无效分类 ID")
  }

  const name = data.name.trim()
  const slug = data.slug.trim()
  const description = data.description.trim()

  if (!name) {
    throw new Error("分类名称不能为空")
  }

  await new UpdateCategoryCommand(ctx, {
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
  const ctx = await getRequiredAdminContext()
  const { id } = getFormDataValues(formData, ["id"] as const)
  await new DeleteCategoryCommand(ctx, { id: parseRequiredId(id, "无效分类 ID") }).execute()

  revalidatePath("/cms/categories")
  revalidatePath("/cms/contents")
}
