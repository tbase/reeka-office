"use server"

import {
  CreateRedemptionProductCommand,
  DeleteRedemptionProductCommand,
  OffShelfRedemptionProductCommand,
  PublishRedemptionProductCommand,
  UpdateRedemptionProductCommand,
} from "@reeka-office/domain-point"
import { revalidatePath } from "next/cache"

const DEFAULT_OPERATOR_ID = 1

function parseId(value: FormDataEntryValue | null): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效兑换商品 ID")
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

function parseNonNegativeInt(value: FormDataEntryValue | null, label: string): number {
  const raw = String(value ?? "").trim()
  const num = Number(raw)
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`${label}必须为非负整数`)
  }
  return num
}

function parsePositiveInt(value: FormDataEntryValue | null, label: string): number {
  const raw = String(value ?? "").trim()
  const num = Number(raw)
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`${label}必须为正整数`)
  }
  return num
}

function parseOptionalPositiveInt(value: FormDataEntryValue | null, label: string): number | null {
  const raw = String(value ?? "").trim()
  if (!raw) {
    return null
  }

  return parsePositiveInt(raw, label)
}

function parseOptionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim()
  return text || null
}

function revalidateProducts(): void {
  revalidatePath("/points/products")
}

export async function createProductAction(formData: FormData): Promise<void> {
  const redeemCategory = parseRequiredText(formData.get("redeemCategory"), "兑换类别")
  const title = parseRequiredText(formData.get("title"), "兑换标题")
  const description = parseOptionalText(formData.get("description"))
  const notice = parseOptionalText(formData.get("notice"))
  const imageUrl = parseOptionalText(formData.get("imageUrl"))
  const stock = parseNonNegativeInt(formData.get("stock"), "库存")
  const redeemPoints = parsePositiveInt(formData.get("redeemPoints"), "兑换积分")
  const maxRedeemPerAgent = parsePositiveInt(formData.get("maxRedeemPerAgent"), "每人可兑换次数")
  const validPeriodMonths = parseOptionalPositiveInt(formData.get("validPeriodMonths"), "有效期（月）")

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
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const id = parseId(formData.get("id"))
  const redeemCategory = parseRequiredText(formData.get("redeemCategory"), "兑换类别")
  const title = parseRequiredText(formData.get("title"), "兑换标题")
  const description = parseOptionalText(formData.get("description"))
  const notice = parseOptionalText(formData.get("notice"))
  const imageUrl = parseOptionalText(formData.get("imageUrl"))
  const stock = parseNonNegativeInt(formData.get("stock"), "库存")
  const redeemPoints = parsePositiveInt(formData.get("redeemPoints"), "兑换积分")
  const maxRedeemPerAgent = parsePositiveInt(formData.get("maxRedeemPerAgent"), "每人可兑换次数")
  const validPeriodMonths = parseOptionalPositiveInt(formData.get("validPeriodMonths"), "有效期（月）")

  await new UpdateRedemptionProductCommand({
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
  }).execute()

  revalidateProducts()
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = parseId(formData.get("id"))
  const ok = await new DeleteRedemptionProductCommand({ id }).execute()
  if (!ok) {
    throw new Error("仅草稿状态商品可删除")
  }

  revalidateProducts()
}

export async function publishProductAction(formData: FormData): Promise<void> {
  const id = parseId(formData.get("id"))
  const ok = await new PublishRedemptionProductCommand({ id }).execute()
  if (!ok) {
    throw new Error("仅草稿状态商品可发布")
  }

  revalidateProducts()
}

export async function offShelfProductAction(formData: FormData): Promise<void> {
  const id = parseId(formData.get("id"))
  const ok = await new OffShelfRedemptionProductCommand({ id }).execute()
  if (!ok) {
    throw new Error("仅已发布商品可下架")
  }

  revalidateProducts()
}
