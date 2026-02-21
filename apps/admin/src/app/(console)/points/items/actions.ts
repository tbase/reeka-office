"use server"

import {
  CreatePointItemCommand,
  DeletePointItemCommand,
  UpdatePointItemCommand,
} from "@reeka-office/domain-point"
import { revalidatePath } from "next/cache"

const DEFAULT_OPERATOR_ID = 1

function parseId(value: FormDataEntryValue | null): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效积分事项 ID")
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

export async function createPointItemAction(formData: FormData) {
  const name = parseRequiredText(formData.get("name"), "事项名称")
  const category = parseRequiredText(formData.get("category"), "事项类别")
  const pointAmount = parseOptionalPositiveInt(formData.get("pointAmount"), "积分金额")
  const annualLimit = parseOptionalPositiveInt(formData.get("annualLimit"), "每年次数上限")

  await new CreatePointItemCommand({
    name,
    category,
    pointAmount,
    annualLimit,
    standard: null,
    createdBy: DEFAULT_OPERATOR_ID,
  }).execute()

  revalidatePath("/points/items")
  revalidatePath("/points/agents")
}

export async function updatePointItemAction(formData: FormData) {
  const id = parseId(formData.get("id"))
  const name = parseRequiredText(formData.get("name"), "事项名称")
  const category = parseRequiredText(formData.get("category"), "事项类别")
  const pointAmount = parseOptionalPositiveInt(formData.get("pointAmount"), "积分金额")
  const annualLimit = parseOptionalPositiveInt(formData.get("annualLimit"), "每年次数上限")

  await new UpdatePointItemCommand({
    id,
    name,
    category,
    pointAmount,
    annualLimit,
    standard: null,
  }).execute()

  revalidatePath("/points/items")
  revalidatePath("/points/agents")
}

export async function deletePointItemAction(formData: FormData) {
  const id = parseId(formData.get("id"))
  const ok = await new DeletePointItemCommand({ id }).execute()
  if (!ok) {
    throw new Error("删除失败，积分事项不存在")
  }

  revalidatePath("/points/items")
  revalidatePath("/points/agents")
}
