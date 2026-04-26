import { z } from "zod"

const optionalNumberSchema = z.preprocess((value) => {
  if (value === "" || value == null) {
    return undefined
  }

  return Number(value)
}, z.number().int().positive().optional())

const sortOrderSchema = z.preprocess((value) => {
  if (value === "" || value == null) {
    return 0
  }

  return Number(value)
}, z.number().int())

const profileFieldSchema = z.object({
  id: optionalNumberSchema,
  name: z.string().trim().min(1, "请输入字段名称").max(100, "字段名称不能超过 100 个字符"),
  description: z.string().trim().optional().nullable(),
  enabled: z.boolean(),
  sortOrder: sortOrderSchema,
})

const followUpStatusSchema = z.object({
  id: optionalNumberSchema,
  name: z.string().trim().min(1, "请输入状态名称").max(100, "状态名称不能超过 100 个字符"),
  enabled: z.boolean(),
  sortOrder: sortOrderSchema,
})

export const createCustomerTypeActionSchema = z.object({
  name: z.string().trim().min(1, "请输入客户类型名称").max(100, "客户类型名称不能超过 100 个字符"),
  description: z.string().trim().optional().nullable(),
  enabled: z.boolean(),
  supportsOpportunity: z.boolean(),
  sortOrder: sortOrderSchema,
  profileFields: z.array(profileFieldSchema),
  followUpStatuses: z.array(followUpStatusSchema),
})

export const updateCustomerTypeActionSchema = createCustomerTypeActionSchema.extend({
  id: z.number().int().positive(),
})
