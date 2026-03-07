"use server"

import {
  CreateNewbieTaskStageCommand,
  DeleteNewbieTaskStageCommand,
  UpdateNewbieTaskStageCommand,
} from "@reeka-office/domain-newbie"
import { revalidatePath } from "next/cache"

function parseId(value: FormDataEntryValue | null): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效阶段 ID")
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

export async function createNewbieStageAction(formData: FormData): Promise<{ success: true }> {
  const stage = parseRequiredText(formData.get("stage"), "阶段标识")
  const title = parseRequiredText(formData.get("title"), "阶段名称")
  const description = parseOptionalText(formData.get("description"))

  await new CreateNewbieTaskStageCommand({
    stage,
    title,
    description,
  }).execute()

  revalidatePath("/newbie/stages")
  return { success: true }
}

export async function updateNewbieStageAction(formData: FormData): Promise<{ success: true }> {
  const id = parseId(formData.get("id"))
  const stage = parseRequiredText(formData.get("stage"), "阶段标识")
  const title = parseRequiredText(formData.get("title"), "阶段名称")
  const description = parseOptionalText(formData.get("description"))

  const ok = await new UpdateNewbieTaskStageCommand({
    id,
    stage,
    title,
    description,
  }).execute()

  if (!ok) {
    throw new Error("保存失败，任务阶段不存在")
  }

  revalidatePath("/newbie/stages")
  return { success: true }
}

export async function deleteNewbieStageAction(formData: FormData) {
  const id = parseId(formData.get("id"))
  const ok = await new DeleteNewbieTaskStageCommand({ id }).execute()
  if (!ok) {
    throw new Error("删除失败，任务阶段不存在")
  }

  revalidatePath("/newbie/stages")
}
