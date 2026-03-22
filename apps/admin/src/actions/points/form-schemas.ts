import { z } from "zod"

const pointItemIdSchema = z.number().int().positive("无效积分事项 ID")
const productIdSchema = z.number().int().positive("无效兑换商品 ID")
const agentIdSchema = z.number().int().positive("请选择代理人")

function requiredText(label: string) {
  return z.string().trim().min(1, `${label}不能为空`)
}

function optionalText() {
  return z.string().trim().transform((value) => value || null)
}

function parseNumberInput(value: unknown) {
  if (value == null) {
    return undefined
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? Number(trimmed) : undefined
  }

  return value
}

function positiveIntSchema(label: string) {
  const errorMessage = `${label}必须为正整数`

  return z.preprocess(
    parseNumberInput,
    z.number({ error: errorMessage }).int(errorMessage).positive(errorMessage),
  )
}

function nonNegativeIntSchema(label: string) {
  const errorMessage = `${label}必须为非负整数`

  return z.preprocess(
    parseNumberInput,
    z.number({ error: errorMessage }).int(errorMessage).min(0, errorMessage),
  )
}

function optionalPositiveIntSchema(label: string) {
  const errorMessage = `${label}必须为正整数`

  return z
    .preprocess(
      parseNumberInput,
      z.number({ error: errorMessage }).int(errorMessage).positive(errorMessage).optional(),
    )
    .transform((value) => value ?? null)
}

function optionalPositiveIntAsUndefinedSchema(label: string) {
  const errorMessage = `${label}必须为正整数`

  return z.preprocess(
    parseNumberInput,
    z.number({ error: errorMessage }).int(errorMessage).positive(errorMessage).optional(),
  )
}

const pointItemBaseSchema = z.object({
  name: requiredText("事项名称"),
  category: requiredText("事项类别"),
  pointAmount: optionalPositiveIntSchema("积分金额"),
  annualLimit: optionalPositiveIntSchema("每年次数上限"),
})

const productBaseSchema = z.object({
  redeemCategory: requiredText("兑换类别"),
  title: requiredText("兑换标题"),
  description: optionalText(),
  notice: optionalText(),
  imageUrl: optionalText(),
  stock: nonNegativeIntSchema("库存"),
  redeemPoints: positiveIntSchema("兑换积分"),
  maxRedeemPerAgent: positiveIntSchema("每人可兑换次数"),
  validPeriodMonths: optionalPositiveIntSchema("有效期（月）"),
})

const agentPointRecordBaseSchema = z.object({
  agentId: agentIdSchema,
  pointItemId: pointItemIdSchema,
  points: optionalPositiveIntAsUndefinedSchema("积分值"),
  remark: optionalText(),
})

export const createPointItemActionSchema = pointItemBaseSchema
export const updatePointItemActionSchema = pointItemBaseSchema.extend({
  id: pointItemIdSchema,
})
export const pointItemFormSchema = pointItemBaseSchema.extend({
  id: pointItemIdSchema.optional(),
})

export const createProductActionSchema = productBaseSchema
export const updateProductActionSchema = productBaseSchema.extend({
  id: productIdSchema,
})
export const productFormSchema = productBaseSchema.extend({
  id: productIdSchema.optional(),
})

export const createAgentPointRecordActionSchema = agentPointRecordBaseSchema
export const searchAgentsActionSchema = z.object({
  keyword: z.string().trim().optional(),
  agentId: z.string().trim().optional(),
})

export type CreatePointItemActionInput = z.infer<typeof createPointItemActionSchema>
export type UpdatePointItemActionInput = z.infer<typeof updatePointItemActionSchema>
export type PointItemFormInput = z.infer<typeof pointItemFormSchema>

export type CreateProductActionInput = z.infer<typeof createProductActionSchema>
export type UpdateProductActionInput = z.infer<typeof updateProductActionSchema>
export type ProductFormInput = z.infer<typeof productFormSchema>

export type CreateAgentPointRecordActionInput = z.infer<typeof createAgentPointRecordActionSchema>
export type SearchAgentsActionInput = z.infer<typeof searchAgentsActionSchema>
