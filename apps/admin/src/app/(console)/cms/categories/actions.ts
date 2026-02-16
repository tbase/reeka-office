"use server"

import {
  CreateCategoryCommand,
  DeleteCategoryCommand,
  UpdateCategoryCommand,
} from "@reeka-office/domain-cms"
import { revalidatePath } from "next/cache"

import type { FieldSchemaItem } from "@/components/cms/field-schema-editor"

function parseId(value: FormDataEntryValue | null): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效分类 ID")
  }
  return id
}

function parseFieldSchema(value: FormDataEntryValue | null): FieldSchemaItem[] {
  if (typeof value !== "string" || !value.trim()) {
    return []
  }

  const parsed: unknown = JSON.parse(value)
  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.filter((item): item is FieldSchemaItem => {
    if (!item || typeof item !== "object") {
      return false
    }

    const field = item as Record<string, unknown>
    return typeof field.name === "string" && typeof field.label === "string" && typeof field.type === "string"
  })
}

export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const slug = String(formData.get("slug") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const fieldSchema = parseFieldSchema(formData.get("fieldSchema"))

  if (!name) {
    throw new Error("分类名称不能为空")
  }

  await new CreateCategoryCommand({
    name,
    slug: slug || undefined,
    description: description || null,
    fieldSchema,
  }).execute()

  revalidatePath("/cms/categories")
  revalidatePath("/cms/contents")
}

export async function updateCategoryAction(formData: FormData) {
  const id = parseId(formData.get("id"))
  const name = String(formData.get("name") ?? "").trim()
  const slug = String(formData.get("slug") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const fieldSchema = parseFieldSchema(formData.get("fieldSchema"))

  if (!name) {
    throw new Error("分类名称不能为空")
  }

  await new UpdateCategoryCommand({
    id,
    name,
    slug: slug || undefined,
    description: description || null,
    fieldSchema,
  }).execute()

  revalidatePath("/cms/categories")
  revalidatePath("/cms/contents")
}

export async function deleteCategoryAction(formData: FormData) {
  const id = parseId(formData.get("id"))
  await new DeleteCategoryCommand({ id }).execute()

  revalidatePath("/cms/categories")
  revalidatePath("/cms/contents")
}
