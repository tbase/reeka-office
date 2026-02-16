"use client"

import { useMemo, useState } from "react"

import { ImageUpload } from "@/components/ui/image-upload"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type FieldType = "text" | "textarea" | "image" | "number" | "date" | "select" | "switch"

type FieldSchemaItem = {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
  placeholder?: string
}

type CategoryOption = {
  id: number
  name: string
  fieldSchema: FieldSchemaItem[]
}

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "文本",
  textarea: "多行文本",
  image: "图片",
  number: "数字",
  date: "日期",
  select: "下拉选择",
  switch: "开关",
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    return value === "true"
  }
  if (typeof value === "number") {
    return value === 1
  }
  return false
}

function initialValueForField(field: FieldSchemaItem): unknown {
  if (field.type === "switch") {
    return false
  }

  return ""
}

function normalizeFieldValue(field: FieldSchemaItem, value: unknown): unknown {
  if (value === undefined || value === null) {
    return initialValueForField(field)
  }

  if (field.type === "switch") {
    return toBoolean(value)
  }

  if (field.type === "number") {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : ""
    }

    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed) {
        return ""
      }
      const parsed = Number(trimmed)
      return Number.isFinite(parsed) ? parsed : ""
    }

    return ""
  }

  if (typeof value === "string") {
    if (field.type === "date") {
      return value.slice(0, 10)
    }

    return value
  }

  return String(value)
}

function buildFieldsState(schema: FieldSchemaItem[], source?: Record<string, unknown>): Record<string, unknown> {
  const sourceRecord = source ?? {}
  const next: Record<string, unknown> = { ...sourceRecord }

  for (const field of schema) {
    next[field.name] = normalizeFieldValue(field, sourceRecord[field.name])
  }

  return next
}

export function ContentFieldsJson({
  categories,
  defaultCategoryId,
  defaultFields,
}: {
  categories: CategoryOption[]
  defaultCategoryId?: number
  defaultFields?: Record<string, unknown>
}) {
  const initialCategory = categories.find((category) => category.id === defaultCategoryId) ?? categories[0]

  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategory?.id)
  const [fieldsByCategory, setFieldsByCategory] = useState<Record<number, Record<string, unknown>>>(() => {
    if (!initialCategory) {
      return {}
    }

    return {
      [initialCategory.id]: buildFieldsState(initialCategory.fieldSchema, defaultFields),
    }
  })

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId]
  )

  const fields = useMemo(() => {
    if (!selectedCategory || !categoryId) {
      return {}
    }

    return buildFieldsState(selectedCategory.fieldSchema, fieldsByCategory[categoryId])
  }, [categoryId, fieldsByCategory, selectedCategory])

  const schemaFieldNameSet = useMemo(
    () => new Set(selectedCategory?.fieldSchema.map((field) => field.name) ?? []),
    [selectedCategory]
  )

  const extraFieldNames = useMemo(
    () => Object.keys(fields).filter((name) => !schemaFieldNameSet.has(name)),
    [fields, schemaFieldNameSet]
  )

  const serializedFields = useMemo(() => JSON.stringify(fields), [fields])

  const updateField = (fieldName: string, value: unknown) => {
    if (!categoryId) {
      return
    }

    setFieldsByCategory((current) => ({
      ...current,
      [categoryId]: {
        ...buildFieldsState(selectedCategory?.fieldSchema ?? [], current[categoryId]),
        [fieldName]: value,
      },
    }))
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="fieldsJson" value={serializedFields} />

      <select
        className="border-input dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm"
        name="categoryId"
        required
        value={categoryId ? String(categoryId) : ""}
        onChange={(event) => {
          const nextId = Number(event.target.value)
          const nextCategory = categories.find((category) => category.id === nextId)
          setCategoryId(nextId)
          if (nextCategory) {
            setFieldsByCategory((current) => {
              if (current[nextId]) {
                return current
              }

              return {
                ...current,
                [nextId]: buildFieldsState(nextCategory.fieldSchema),
              }
            })
          }
        }}
      >
        {categories.length === 0 ? <option value="">暂无分类</option> : null}
        {categories.map((category) => (
          <option key={category.id} value={String(category.id)}>
            {category.name}
          </option>
        ))}
      </select>

      {selectedCategory && selectedCategory.fieldSchema.length > 0 ? (
        <div className="space-y-3">
          {selectedCategory.fieldSchema.map((field) => {
            const rawValue = fields[field.name]
            const value = normalizeFieldValue(field, rawValue)

            return (
              <div key={field.name} className="space-y-1.5">
                <label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                  {field.label}
                  {field.required ? <span className="text-destructive ml-1">*</span> : null}
                  <span className="text-muted-foreground ml-1 text-xs">({FIELD_TYPE_LABEL[field.type]})</span>
                </label>

                {field.type === "textarea" ? (
                  <Textarea
                    id={`field-${field.name}`}
                    value={String(value)}
                    onChange={(event) => updateField(field.name, event.target.value)}
                    placeholder={field.placeholder || `请输入${field.label}`}
                    rows={4}
                  />
                ) : null}

                {field.type === "switch" ? (
                  <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                    <input
                      id={`field-${field.name}`}
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => updateField(field.name, event.target.checked)}
                    />
                    开启
                  </label>
                ) : null}

                {field.type === "select" ? (
                  <select
                    id={`field-${field.name}`}
                    className="border-input dark:bg-input/30 h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm"
                    value={String(value)}
                    onChange={(event) => updateField(field.name, event.target.value)}
                  >
                    <option value="">请选择</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : null}

                {field.type === "image" ? (
                  <ImageUpload
                    id={`field-${field.name}`}
                    value={typeof value === "string" ? value : ""}
                    alt={field.label}
                    onChangeAction={(nextValue) => updateField(field.name, nextValue)}
                  />
                ) : null}

                {field.type !== "textarea" && field.type !== "switch" && field.type !== "select" && field.type !== "image" ? (
                  <Input
                    id={`field-${field.name}`}
                    type={field.type === "number" || field.type === "date" ? field.type : "text"}
                    value={field.type === "number" ? String(value) : String(value)}
                    onChange={(event) => {
                      if (field.type === "number") {
                        const nextValue = event.target.value
                        if (!nextValue.trim()) {
                          updateField(field.name, "")
                          return
                        }

                        const parsed = Number(nextValue)
                        updateField(field.name, Number.isFinite(parsed) ? parsed : "")
                        return
                      }

                      updateField(field.name, event.target.value)
                    }}
                    placeholder={field.placeholder || `请输入${field.label}`}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
          {selectedCategory ? "该分类暂无扩展字段。" : "请先创建分类。"}
        </div>
      )}

      {extraFieldNames.length > 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
          已保留历史字段：{extraFieldNames.join(", ")}（当前分类未定义，提交时会一并保存）
        </div>
      ) : null}
    </div>
  )
}
