import { z } from "zod"

function parsePositiveInt(value: unknown) {
  if (value == null) {
    return undefined
  }

  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : undefined
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed || trimmed === "undefined" || trimmed === "$undefined") {
      return undefined
    }

    const parsed = Number(trimmed)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }

  return undefined
}

const optionalNumberSchema = z.preprocess(
  parsePositiveInt,
  z.union([z.number().int().positive(), z.undefined()]),
).optional()

const sortOrderSchema = z.preprocess((value) => {
  if (value === "" || value == null) {
    return 0
  }

  return Number(value)
}, z.number().int())

function parseBoolean(value: unknown) {
  if (typeof value === "number") {
    return value === 1
  }

  if (typeof value === "string") {
    return value === "true" || value === "1"
  }

  return value
}

const booleanSchema = z.preprocess(parseBoolean, z.boolean())

const profileFieldSchema = z.object({
  id: optionalNumberSchema,
  name: z.string().trim().min(1, "请输入字段名称").max(100, "字段名称不能超过 100 个字符"),
  description: z.string().trim().optional().nullable(),
  enabled: booleanSchema,
  sortOrder: sortOrderSchema,
})

const customerTypeActionSchema = z.object({
  name: z.string().trim().min(1, "请输入客户类型名称").max(100, "客户类型名称不能超过 100 个字符"),
  description: z.string().trim().optional().nullable(),
  enabled: booleanSchema,
  supportsOpportunity: booleanSchema,
  sortOrder: sortOrderSchema,
  profileFields: z.array(profileFieldSchema),
}).superRefine((value, ctx) => {
  const seen = new Map<string, number>()

  value.profileFields.forEach((field, index) => {
    const name = field.name.trim()
    const firstIndex = seen.get(name)
    if (firstIndex === undefined) {
      seen.set(name, index)
      return
    }

    ctx.addIssue({
      code: "custom",
      path: ["profileFields", index, "name"],
      message: `字段名称不能重复，已和第 ${firstIndex + 1} 行重复`,
    })
  })
})

export const createCustomerTypeActionSchema = customerTypeActionSchema

export const updateCustomerTypeActionSchema = customerTypeActionSchema.extend({
  id: z.number().int().positive(),
})
