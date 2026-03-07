"use server"

import {
  CreateCategoryCommand,
  DeleteCategoryCommand,
  UpdateCategoryCommand,
  type FieldSchemaItem,
} from "@reeka-office/domain-cms"
import { revalidatePath } from "next/cache"

export type CategoryActionInput = {
  id?: number
  name: string
  slug: string
  description: string
  hideContent: boolean
  fieldSchema: FieldSchemaItem[]
}

export async function createCategoryAction(data: CategoryActionInput): Promise<{ success: true }> {
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
  const id = Number(formData.get("id"))
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效分类 ID")
  }
  await new DeleteCategoryCommand({ id }).execute()

  revalidatePath("/cms/categories")
  revalidatePath("/cms/contents")
}
