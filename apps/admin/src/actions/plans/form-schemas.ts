import { z } from "zod"

const planIdSchema = z.number().int().positive("无效计划 ID")
const stageIdSchema = z.number().int().positive("无效阶段 ID")
const taskIdSchema = z.number().int().positive("无效任务 ID")
const taskCategoryIdSchema = z.number().int().positive("无效任务分类 ID")

function requiredText(label: string) {
  return z.string().trim().min(1, `${label}不能为空`)
}

function requiredLineList(label: string) {
  return z
    .union([z.string(), z.array(z.string())])
    .transform((value) => {
      const items = typeof value === "string" ? value.split(/\r?\n/) : value

      return items.map((item) => item.trim()).filter(Boolean)
    })
    .refine((value) => value.length > 0, {
      message: `${label}不能为空`,
    })
}

function optionalText() {
  return z.string().nullable().optional().transform((value) => {
    if (typeof value !== "string") {
      return null
    }

    const trimmed = value.trim()
    return trimmed || null
  })
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

function optionalPositiveIntSchema(label: string) {
  const errorMessage = `${label}必须为正整数`

  return z
    .preprocess(
      parseNumberInput,
      z.number({ error: errorMessage }).int(errorMessage).positive(errorMessage).optional(),
    )
    .transform((value) => value ?? null)
}

const planBaseSchema = z.object({
  name: requiredText("计划名称"),
  description: optionalText(),
})

const planStageBaseSchema = z.object({
  planId: planIdSchema,
  title: requiredText("阶段标题"),
  description: optionalText(),
})

const createPlanStageBaseSchema = z.object({
  planId: planIdSchema,
  titles: requiredLineList("阶段标题"),
})

const planTaskBaseSchema = z.object({
  planId: planIdSchema,
  stageId: stageIdSchema,
  categoryId: taskCategoryIdSchema,
  title: requiredText("任务标题"),
  description: optionalText(),
  taskType: z.enum(["normal", "metric"]),
  isRequired: z.boolean(),
  pointItemId: optionalPositiveIntSchema("奖励积分事项"),
})

const planTaskCategoryBaseSchema = z.object({
  name: requiredText("任务分类名称"),
})

const createPlanTaskCategoryBaseSchema = z.object({
  names: requiredLineList("任务分类名称"),
})

export const createPlanActionSchema = planBaseSchema
export const updatePlanActionSchema = planBaseSchema.extend({
  id: planIdSchema,
})

export const createPlanStageActionSchema = createPlanStageBaseSchema
export const updatePlanStageActionSchema = planStageBaseSchema.extend({
  id: stageIdSchema,
})

export const createPlanTaskActionSchema = planTaskBaseSchema
export const updatePlanTaskActionSchema = planTaskBaseSchema.extend({
  id: taskIdSchema,
})

export const createPlanTaskCategoryActionSchema = createPlanTaskCategoryBaseSchema
export const updatePlanTaskCategoryActionSchema = planTaskCategoryBaseSchema.extend({
  id: taskCategoryIdSchema,
})

export type CreatePlanActionInput = z.infer<typeof createPlanActionSchema>
export type UpdatePlanActionInput = z.infer<typeof updatePlanActionSchema>

export type CreatePlanStageActionInput = z.infer<typeof createPlanStageActionSchema>
export type UpdatePlanStageActionInput = z.infer<typeof updatePlanStageActionSchema>

export type CreatePlanTaskActionInput = z.infer<typeof createPlanTaskActionSchema>
export type UpdatePlanTaskActionInput = z.infer<typeof updatePlanTaskActionSchema>

export type CreatePlanTaskCategoryActionInput = z.infer<typeof createPlanTaskCategoryActionSchema>
export type UpdatePlanTaskCategoryActionInput = z.infer<typeof updatePlanTaskCategoryActionSchema>
