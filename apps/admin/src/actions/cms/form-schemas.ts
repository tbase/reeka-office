import { z } from "zod"

const categoryIdSchema = z.number().int().positive("无效分类 ID")
const contentIdSchema = z.number().int().positive("无效内容 ID")

const fieldSchemaItemBaseSchema = z.object({
  name: z.string().trim().min(1, "字段名称不能为空"),
  label: z.string().trim().min(1, "字段标签不能为空"),
  required: z.boolean().optional(),
})

export const fieldSchemaItemSchema = z.discriminatedUnion("type", [
  fieldSchemaItemBaseSchema.extend({
    type: z.enum(["text", "textarea", "number", "date", "switch"]),
    placeholder: z.string().optional(),
  }),
  fieldSchemaItemBaseSchema.extend({
    type: z.literal("image"),
    props: z
      .object({
        multiple: z.boolean().optional(),
      })
      .optional(),
  }),
  fieldSchemaItemBaseSchema.extend({
    type: z.literal("options"),
    props: z.object({
      options: z.array(z.string().trim().min(1, "选项不能为空")),
      multiple: z.boolean().optional(),
    }),
  }),
])

const categoryBaseSchema = z.object({
  name: z.string().trim().min(1, "分类名称不能为空"),
  slug: z.string().trim(),
  description: z.string().trim().optional(),
  hideContent: z.boolean(),
  fieldSchema: z.array(fieldSchemaItemSchema),
})

const contentBaseSchema = z.object({
  categoryId: z.number().int().positive("请选择分类"),
  name: z.string().trim().min(1, "标题不能为空"),
  content: z.string(),
  fields: z.record(z.string(), z.unknown()),
})

export const createCategoryActionSchema = categoryBaseSchema
export const updateCategoryActionSchema = categoryBaseSchema.extend({
  id: categoryIdSchema,
})
export const categoryFormSchema = categoryBaseSchema.extend({
  id: categoryIdSchema.optional(),
})

export const createContentActionSchema = contentBaseSchema
export const updateContentActionSchema = contentBaseSchema.extend({
  id: contentIdSchema,
})
export const contentFormSchema = contentBaseSchema.extend({
  id: contentIdSchema.optional(),
})

export type CreateCategoryActionInput = z.infer<typeof createCategoryActionSchema>
export type UpdateCategoryActionInput = z.infer<typeof updateCategoryActionSchema>
export type CategoryFormInput = z.infer<typeof categoryFormSchema>

export type CreateContentActionInput = z.infer<typeof createContentActionSchema>
export type UpdateContentActionInput = z.infer<typeof updateContentActionSchema>
export type ContentFormInput = z.infer<typeof contentFormSchema>
