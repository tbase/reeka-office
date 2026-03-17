"use server"

import {
  CreatePointItemCommand,
  DeletePointItemCommand,
  UpdatePointItemCommand,
} from "@reeka-office/domain-point"
import { revalidatePath } from "next/cache"

import { getRequiredAdminContext } from "@/lib/admin-context"
import {
  getFormDataValues,
  parseOptionalId,
  parseOptionalPositiveInt,
  parseRequiredId,
  parseRequiredText,
} from "@/lib/form-data"

const DEFAULT_OPERATOR_ID = 1
const pointItemFieldNames = ["id", "name", "category", "pointAmount", "annualLimit"] as const

function parsePointItemInput(formData: FormData) {
  const fields = getFormDataValues(formData, pointItemFieldNames)

  return {
    id: parseOptionalId(fields.id, "无效积分事项 ID"),
    name: parseRequiredText(fields.name, "事项名称"),
    category: parseRequiredText(fields.category, "事项类别"),
    pointAmount: parseOptionalPositiveInt(fields.pointAmount, "积分金额"),
    annualLimit: parseOptionalPositiveInt(fields.annualLimit, "每年次数上限"),
  }
}

function parsePointItemId(formData: FormData): number {
  const { id } = getFormDataValues(formData, ["id"] as const)
  return parseRequiredId(id, "无效积分事项 ID")
}

export async function createPointItemAction(formData: FormData): Promise<{ success: true }> {
  await getRequiredAdminContext()
  const { name, category, pointAmount, annualLimit } = parsePointItemInput(formData)

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
  return { success: true }
}

export async function updatePointItemAction(formData: FormData): Promise<{ success: true }> {
  await getRequiredAdminContext()
  const { id, name, category, pointAmount, annualLimit } = parsePointItemInput(formData)

  await new UpdatePointItemCommand({
    id: parseRequiredId(id, "无效积分事项 ID"),
    name,
    category,
    pointAmount,
    annualLimit,
    standard: null,
  }).execute()

  revalidatePath("/points/items")
  revalidatePath("/points/agents")
  return { success: true }
}

export async function deletePointItemAction(formData: FormData) {
  await getRequiredAdminContext()
  const id = parsePointItemId(formData)
  const ok = await new DeletePointItemCommand({ id }).execute()
  if (!ok) {
    throw new Error("删除失败，积分事项不存在")
  }

  revalidatePath("/points/items")
  revalidatePath("/points/agents")
}
