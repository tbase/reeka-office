"use server"

import {
  CreateRedemptionProductCommand,
  DeleteRedemptionProductCommand,
  OffShelfRedemptionProductCommand,
  PublishRedemptionProductCommand,
  UpdateRedemptionProductCommand,
} from "@reeka-office/domain-point"
import { revalidatePath } from "next/cache"

import { getRequiredAdminContext } from "@/lib/admin-context"
import {
  getFormDataValues,
  parseNonNegativeInt,
  parseOptionalId,
  parseOptionalPositiveInt,
  parseOptionalText,
  parsePositiveInt,
  parseRequiredId,
  parseRequiredText,
} from "@/lib/form-data"

const DEFAULT_OPERATOR_ID = 1
const productFieldNames = [
  "id",
  "redeemCategory",
  "title",
  "description",
  "notice",
  "imageUrl",
  "stock",
  "redeemPoints",
  "maxRedeemPerAgent",
  "validPeriodMonths",
] as const

function parseProductInput(formData: FormData) {
  const fields = getFormDataValues(formData, productFieldNames)

  return {
    id: parseOptionalId(fields.id, "无效兑换商品 ID"),
    redeemCategory: parseRequiredText(fields.redeemCategory, "兑换类别"),
    title: parseRequiredText(fields.title, "兑换标题"),
    description: parseOptionalText(fields.description),
    notice: parseOptionalText(fields.notice),
    imageUrl: parseOptionalText(fields.imageUrl),
    stock: parseNonNegativeInt(fields.stock, "库存"),
    redeemPoints: parsePositiveInt(fields.redeemPoints, "兑换积分"),
    maxRedeemPerAgent: parsePositiveInt(fields.maxRedeemPerAgent, "每人可兑换次数"),
    validPeriodMonths: parseOptionalPositiveInt(fields.validPeriodMonths, "有效期（月）"),
  }
}

function parseProductId(formData: FormData): number {
  const { id } = getFormDataValues(formData, ["id"] as const)
  return parseRequiredId(id, "无效兑换商品 ID")
}

function revalidateProducts(): void {
  revalidatePath("/points/products")
}

export async function createProductAction(formData: FormData): Promise<{ success: true }> {
  await getRequiredAdminContext()
  const {
    redeemCategory,
    title,
    description,
    notice,
    imageUrl,
    stock,
    redeemPoints,
    maxRedeemPerAgent,
    validPeriodMonths,
  } = parseProductInput(formData)

  await new CreateRedemptionProductCommand({
    redeemCategory,
    title,
    description,
    notice,
    imageUrl,
    stock,
    redeemPoints,
    maxRedeemPerAgent,
    validPeriodMonths,
    createdBy: DEFAULT_OPERATOR_ID,
  }).execute()

  revalidateProducts()
  return { success: true }
}

export async function updateProductAction(formData: FormData): Promise<{ success: true }> {
  await getRequiredAdminContext()
  const {
    id,
    redeemCategory,
    title,
    description,
    notice,
    imageUrl,
    stock,
    redeemPoints,
    maxRedeemPerAgent,
    validPeriodMonths,
  } = parseProductInput(formData)

  await new UpdateRedemptionProductCommand({
    id: parseRequiredId(id, "无效兑换商品 ID"),
    redeemCategory,
    title,
    description,
    notice,
    imageUrl,
    stock,
    redeemPoints,
    maxRedeemPerAgent,
    validPeriodMonths,
  }).execute()

  revalidateProducts()
  return { success: true }
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await getRequiredAdminContext()
  const id = parseProductId(formData)
  const ok = await new DeleteRedemptionProductCommand({ id }).execute()
  if (!ok) {
    throw new Error("仅草稿状态商品可删除")
  }

  revalidateProducts()
}

export async function publishProductAction(formData: FormData): Promise<void> {
  await getRequiredAdminContext()
  const id = parseProductId(formData)
  const ok = await new PublishRedemptionProductCommand({ id }).execute()
  if (!ok) {
    throw new Error("仅草稿状态商品可发布")
  }

  revalidateProducts()
}

export async function offShelfProductAction(formData: FormData): Promise<void> {
  await getRequiredAdminContext()
  const id = parseProductId(formData)
  const ok = await new OffShelfRedemptionProductCommand({ id }).execute()
  if (!ok) {
    throw new Error("仅已发布商品可下架")
  }

  revalidateProducts()
}
