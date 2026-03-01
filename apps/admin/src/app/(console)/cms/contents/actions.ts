"use server"

import {
  CreateContentCommand,
  DeleteContentCommand,
  UpdateContentCommand,
} from "@reeka-office/domain-cms"
import { revalidatePath } from "next/cache"

function parseId(value: FormDataEntryValue | null, label: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`无效${label} ID`)
  }
  return id
}

function parseFields(value: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) {
    return {}
  }

  const parsed: unknown = JSON.parse(value)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {}
  }

  return parsed as Record<string, unknown>
}

export async function createContentAction(formData: FormData): Promise<{ success: true }> {
  const categoryId = parseId(formData.get("categoryId"), "分类")
  const name = String(formData.get("name") ?? "").trim()
  const content = String(formData.get("content") ?? "")
  const fields = parseFields(formData.get("fieldsJson"))

  if (!name) {
    throw new Error("内容名称不能为空")
  }

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
  const id = parseId(formData.get("id"), "内容")
  const categoryId = parseId(formData.get("categoryId"), "分类")
  const name = String(formData.get("name") ?? "").trim()
  const content = String(formData.get("content") ?? "")
  const fields = parseFields(formData.get("fieldsJson"))

  if (!name) {
    throw new Error("内容名称不能为空")
  }

  await new UpdateContentCommand({
    id,
    categoryId,
    name,
    content,
    fields,
  }).execute()

  revalidatePath("/cms/contents")
  return { success: true }
}

export async function deleteContentAction(formData: FormData) {
  const id = parseId(formData.get("id"), "内容")
  await new DeleteContentCommand({ id }).execute()

  revalidatePath("/cms/contents")
}
