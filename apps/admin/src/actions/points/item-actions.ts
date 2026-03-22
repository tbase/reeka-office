"use server"

import { revalidatePath } from "next/cache"

import {
  CreatePointItemCommand,
  DeletePointItemCommand,
  UpdatePointItemCommand,
} from "@reeka-office/domain-point"

import {
  createPointItemActionSchema,
  updatePointItemActionSchema,
} from "@/actions/points/form-schemas"
import { getFormDataValues, parseRequiredId } from "@/lib/form-data"
import { adminActionClient } from "@/lib/safe-action"

const DEFAULT_OPERATOR_ID = 1

function revalidatePointItems() {
  revalidatePath("/points/items")
  revalidatePath("/points/agents")
}

export const createPointItemAction = adminActionClient
  .inputSchema(createPointItemActionSchema)
  .action(async ({ parsedInput }) => {
    await new CreatePointItemCommand({
      name: parsedInput.name,
      category: parsedInput.category,
      pointAmount: parsedInput.pointAmount,
      annualLimit: parsedInput.annualLimit,
      standard: null,
      createdBy: DEFAULT_OPERATOR_ID,
    }).execute()

    revalidatePointItems()
    return { success: true }
  })

export const updatePointItemAction = adminActionClient
  .inputSchema(updatePointItemActionSchema)
  .action(async ({ parsedInput }) => {
    await new UpdatePointItemCommand({
      id: parsedInput.id,
      name: parsedInput.name,
      category: parsedInput.category,
      pointAmount: parsedInput.pointAmount,
      annualLimit: parsedInput.annualLimit,
      standard: null,
    }).execute()

    revalidatePointItems()
    return { success: true }
  })

export type CreatePointItemAction = typeof createPointItemAction
export type UpdatePointItemAction = typeof updatePointItemAction
export type PointItemFormAction = CreatePointItemAction | UpdatePointItemAction

export async function deletePointItemAction(formData: FormData) {
  const { id } = getFormDataValues(formData, ["id"] as const)
  const ok = await new DeletePointItemCommand({
    id: parseRequiredId(id, "无效积分事项 ID"),
  }).execute()

  if (!ok) {
    throw new Error("删除失败，积分事项不存在")
  }

  revalidatePointItems()
}
