"use server"

import {
  CreateNewbieTaskCategoryCommand,
  CreateNewbieTaskCommand,
  DeleteNewbieTaskCategoryCommand,
  DeleteNewbieTaskCommand,
  ReorderNewbieTasksInStageCommand,
  UpdateNewbieTaskCategoryCommand,
  UpdateNewbieTaskCommand,
  type ReorderNewbieTasksInStageInput,
} from "@reeka-office/domain-newbie"
import { revalidatePath } from "next/cache"

const NEWBIE_TASKS_PATH = "/newbie/tasks"

interface TaskFormInput {
  title: string
  description: string | null
  stageId: number
  categoryName: string
  displayOrder: number
  pointEventId: number
  pointAmount: number | null
}

function parseId(value: FormDataEntryValue | null, label: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`无效${label}`)
  }
  return id
}

function parseRequiredText(value: FormDataEntryValue | null, label: string): string {
  const text = String(value ?? "").trim()
  if (!text) {
    throw new Error(`${label}不能为空`)
  }
  return text
}

function parseOptionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim()
  return text || null
}

function parseNonNegativeInt(value: FormDataEntryValue | null, label: string): number {
  const num = Number(String(value ?? "").trim())
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`${label}必须为大于等于 0 的整数`)
  }
  return num
}

function parseOptionalPositiveInt(
  value: FormDataEntryValue | null,
  label: string,
): number | null {
  const raw = String(value ?? "").trim()
  if (!raw) {
    return null
  }

  const num = Number(raw)
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`${label}必须为正整数`)
  }

  return num
}

function parseTaskIdsJson(value: FormDataEntryValue | null): number[] {
  const raw = String(value ?? "").trim()
  if (!raw) {
    throw new Error("任务顺序不能为空")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("任务顺序格式错误")
  }

  if (!Array.isArray(parsed)) {
    throw new Error("任务顺序格式错误")
  }

  const ids = parsed.map((item) => Number(item))
  if (ids.length === 0) {
    throw new Error("任务顺序不能为空")
  }

  for (const id of ids) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("任务顺序包含无效任务 ID")
    }
  }

  const uniqueSize = new Set(ids).size
  if (uniqueSize !== ids.length) {
    throw new Error("任务顺序包含重复任务")
  }

  return ids
}

function parseTaskFormInput(formData: FormData): TaskFormInput {
  return {
    title: parseRequiredText(formData.get("title"), "任务名称"),
    description: parseOptionalText(formData.get("description")),
    stageId: parseId(formData.get("stageId"), "阶段 ID"),
    categoryName: parseRequiredText(formData.get("categoryName"), "任务分类"),
    displayOrder: parseNonNegativeInt(formData.get("displayOrder"), "展示顺序"),
    pointEventId: parseId(formData.get("pointEventId"), "积分事项"),
    pointAmount: parseOptionalPositiveInt(formData.get("pointAmount"), "积分值"),
  }
}

function parseReorderInput(formData: FormData): ReorderNewbieTasksInStageInput {
  return {
    stageId: parseId(formData.get("stageId"), "阶段 ID"),
    orderedTaskIds: parseTaskIdsJson(formData.get("orderedTaskIds")),
  }
}

function revalidateNewbieTasks(): { success: true } {
  revalidatePath(NEWBIE_TASKS_PATH)
  return { success: true }
}

export async function createNewbieTaskAction(formData: FormData): Promise<{ success: true }> {
  const input = parseTaskFormInput(formData)

  await new CreateNewbieTaskCommand(input).execute()

  return revalidateNewbieTasks()
}

export async function createNewbieTaskCategoryAction(
  formData: FormData,
): Promise<{ success: true }> {
  const name = parseRequiredText(formData.get("name"), "任务分类")

  await new CreateNewbieTaskCategoryCommand({ name }).execute()

  return revalidateNewbieTasks()
}

export async function updateNewbieTaskAction(formData: FormData): Promise<{ success: true }> {
  const id = parseId(formData.get("id"), "任务 ID")
  const input = parseTaskFormInput(formData)

  const ok = await new UpdateNewbieTaskCommand({
    id,
    ...input,
  }).execute()

  if (!ok) {
    throw new Error("保存失败，任务不存在")
  }

  return revalidateNewbieTasks()
}

export async function reorderNewbieTasksInStageAction(
  formData: FormData,
): Promise<{ success: true }> {
  await new ReorderNewbieTasksInStageCommand(parseReorderInput(formData)).execute()

  return revalidateNewbieTasks()
}

export async function updateNewbieTaskCategoryAction(
  formData: FormData,
): Promise<{ success: true }> {
  const id = parseId(formData.get("id"), "分类 ID")
  const name = parseRequiredText(formData.get("name"), "任务分类")

  const ok = await new UpdateNewbieTaskCategoryCommand({ id, name }).execute()
  if (!ok) {
    throw new Error("保存失败，任务分类不存在")
  }

  return revalidateNewbieTasks()
}

export async function deleteNewbieTaskAction(formData: FormData) {
  const id = parseId(formData.get("id"), "任务 ID")
  const ok = await new DeleteNewbieTaskCommand({ id }).execute()
  if (!ok) {
    throw new Error("删除失败，任务不存在")
  }

  revalidatePath(NEWBIE_TASKS_PATH)
}

export async function deleteNewbieTaskCategoryAction(formData: FormData) {
  const id = parseId(formData.get("id"), "分类 ID")
  const ok = await new DeleteNewbieTaskCategoryCommand({ id }).execute()
  if (!ok) {
    throw new Error("删除失败，任务分类不存在")
  }

  revalidatePath(NEWBIE_TASKS_PATH)
}
