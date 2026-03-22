"use server"

import { revalidatePath } from "next/cache"

import {
  CreateRedemptionProductCommand,
  DeleteRedemptionProductCommand,
  OffShelfRedemptionProductCommand,
  PublishRedemptionProductCommand,
  UpdateRedemptionProductCommand,
} from "@reeka-office/domain-point"

import {
  createProductActionSchema,
  updateProductActionSchema,
} from "@/actions/points/form-schemas"
import { getFormDataValues, parseRequiredId } from "@/lib/form-data"
import { adminActionClient } from "@/lib/safe-action"

const DEFAULT_OPERATOR_ID = 1

function parseProductId(formData: FormData): number {
  const { id } = getFormDataValues(formData, ["id"] as const)
  return parseRequiredId(id, "无效兑换商品 ID")
}

function revalidateProducts() {
  revalidatePath("/points/products")
}

export const createProductAction = adminActionClient
  .inputSchema(createProductActionSchema)
  .action(async ({ parsedInput }) => {
    await new CreateRedemptionProductCommand({
      redeemCategory: parsedInput.redeemCategory,
      title: parsedInput.title,
      description: parsedInput.description,
      notice: parsedInput.notice,
      imageUrl: parsedInput.imageUrl,
      stock: parsedInput.stock,
      redeemPoints: parsedInput.redeemPoints,
      maxRedeemPerAgent: parsedInput.maxRedeemPerAgent,
      validPeriodMonths: parsedInput.validPeriodMonths,
      createdBy: DEFAULT_OPERATOR_ID,
    }).execute()

    revalidateProducts()
    return { success: true }
  })

export const updateProductAction = adminActionClient
  .inputSchema(updateProductActionSchema)
  .action(async ({ parsedInput }) => {
    await new UpdateRedemptionProductCommand({
      id: parsedInput.id,
      redeemCategory: parsedInput.redeemCategory,
      title: parsedInput.title,
      description: parsedInput.description,
      notice: parsedInput.notice,
      imageUrl: parsedInput.imageUrl,
      stock: parsedInput.stock,
      redeemPoints: parsedInput.redeemPoints,
      maxRedeemPerAgent: parsedInput.maxRedeemPerAgent,
      validPeriodMonths: parsedInput.validPeriodMonths,
    }).execute()

    revalidateProducts()
    return { success: true }
  })

export type CreateProductAction = typeof createProductAction
export type UpdateProductAction = typeof updateProductAction
export type ProductFormAction = CreateProductAction | UpdateProductAction

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = parseProductId(formData)
  const ok = await new DeleteRedemptionProductCommand({ id }).execute()
  if (!ok) {
    throw new Error("仅草稿状态商品可删除")
  }

  revalidateProducts()
}

export async function publishProductAction(formData: FormData): Promise<void> {
  const id = parseProductId(formData)
  const ok = await new PublishRedemptionProductCommand({ id }).execute()
  if (!ok) {
    throw new Error("仅草稿状态商品可发布")
  }

  revalidateProducts()
}

export async function offShelfProductAction(formData: FormData): Promise<void> {
  const id = parseProductId(formData)
  const ok = await new OffShelfRedemptionProductCommand({ id }).execute()
  if (!ok) {
    throw new Error("仅已发布商品可下架")
  }

  revalidateProducts()
}
