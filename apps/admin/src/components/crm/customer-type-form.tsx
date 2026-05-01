"use client"

import { useState, type DragEvent } from "react"
import { useFieldArray } from "react-hook-form"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import type { ZodType } from "zod"

import type { CustomerTypeFormAction } from "@/actions/crm/customer-type-actions"
import {
  getErrorMessage,
  getFieldError,
  getFormError,
} from "@/components/crm/form-errors"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export interface CustomerTypeFormValue {
  id?: number
  name?: string
  description?: string | null
  enabled?: boolean
  supportsOpportunity?: boolean
  sortOrder?: number
  profileFields?: Array<{
    id?: number
    name?: string
    description?: string | null
    enabled?: boolean
    sortOrder?: number
  }>
}

const ROOT_FIELD_LABELS: Record<string, string> = {
  name: "类型名称",
  description: "类型说明",
  sortOrder: "排序",
}

const PROFILE_FIELD_LABELS: Record<string, string> = {
  name: "字段名称",
  description: "字段描述",
  sortOrder: "排序",
}

const ERROR_META_KEYS = new Set(["ref", "type", "types"])

function orderProfileFields(formValues: unknown) {
  const values = formValues as CustomerTypeFormValue
  return {
    ...values,
    profileFields: (values.profileFields ?? []).map((field, index) => ({
      ...field,
      sortOrder: index,
    })),
  }
}

function normalizeNumberInput(value: unknown) {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : 0
}

function normalizePositiveInt(value: unknown) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : undefined
  }

  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed === "undefined" || trimmed === "$undefined") {
    return undefined
  }

  const id = Number(trimmed)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value === 1
  }

  if (typeof value === "string") {
    return value === "true" || value === "1"
  }

  return fallback
}

function buildDefaultValues(value?: CustomerTypeFormValue) {
  return {
    id: value?.id,
    name: value?.name ?? "",
    description: value?.description ?? "",
    enabled: normalizeBoolean(value?.enabled, true),
    supportsOpportunity: normalizeBoolean(value?.supportsOpportunity, false),
    sortOrder: value?.sortOrder ?? 0,
    profileFields: value?.profileFields?.map((field) => ({
      id: field.id,
      name: field.name ?? "",
      description: field.description ?? "",
      enabled: normalizeBoolean(field.enabled, true),
      sortOrder: field.sortOrder ?? 0,
    })) ?? [],
  }
}

function formatClientValidationError(path: Array<string | number>, message: string) {
  const profileFieldsIndex = path.indexOf("profileFields")
  if (profileFieldsIndex >= 0) {
    const row = path[profileFieldsIndex + 1]
    const fieldName = path[profileFieldsIndex + 2]
    const fieldLabel = typeof fieldName === "string" ? PROFILE_FIELD_LABELS[fieldName] : null

    if (typeof row === "number") {
      return fieldLabel
        ? `画像字段第 ${row + 1} 行 - ${fieldLabel}：${message}`
        : `画像字段第 ${row + 1} 行：${message}`
    }

    return fieldLabel ? `画像字段 - ${fieldLabel}：${message}` : `画像字段：${message}`
  }

  const fieldName = path[0]
  const fieldLabel = typeof fieldName === "string" ? ROOT_FIELD_LABELS[fieldName] : null

  return fieldLabel ? `${fieldLabel}：${message}` : message
}

function getFirstClientValidationError(errors: unknown, path: Array<string | number> = []): string | null {
  if (!errors || typeof errors !== "object") {
    return null
  }

  const message = getErrorMessage((errors as { message?: unknown }).message)
  if (message) {
    return formatClientValidationError(path, message)
  }

  if (Array.isArray(errors)) {
    for (let index = 0; index < errors.length; index += 1) {
      const nestedMessage = getFirstClientValidationError(errors[index], [...path, index])
      if (nestedMessage) {
        return nestedMessage
      }
    }

    return null
  }

  for (const [key, value] of Object.entries(errors)) {
    if (ERROR_META_KEYS.has(key)) {
      continue
    }

    const parsedKey = Number(key)
    const pathKey = Number.isInteger(parsedKey) && String(parsedKey) === key ? parsedKey : key
    const nestedMessage = getFirstClientValidationError(value, [...path, pathKey])
    if (nestedMessage) {
      return nestedMessage
    }
  }

  return null
}

function getErrorAtPath(errors: unknown, path: Array<string | number>) {
  let current = errors
  for (const segment of path) {
    if (!current || typeof current !== "object") {
      return null
    }

    current = (current as Record<string, unknown>)[String(segment)]
  }

  if (!current || typeof current !== "object") {
    return null
  }

  return getErrorMessage((current as { message?: unknown }).message) ?? null
}

export function CustomerTypeForm<TAction extends CustomerTypeFormAction, TSchema extends ZodType>({
  action,
  schema,
  value,
  id,
  onSuccess,
}: {
  action: TAction
  schema: TSchema
  value?: CustomerTypeFormValue
  id?: string
  onSuccess?: () => void
}) {
  const { form, action: actionState } = useHookFormAction(
    action as never,
    zodResolver(schema as never),
    {
      formProps: {
        shouldUnregister: true,
        defaultValues: buildDefaultValues(value),
      },
      actionProps: {
        onSuccess: () => {
          toast.success(value?.id ? "客户类型已保存" : "客户类型已创建")
          onSuccess?.()
        },
        onError: ({ error }) => {
          const serverError = getErrorMessage(error.serverError)
          if (serverError) {
            toast.error(serverError)
          }
        },
      },
    },
  )

  const profileFields = useFieldArray({
    control: form.control,
    name: "profileFields" as never,
    keyName: "formKey",
  })
  const [draggingFieldKey, setDraggingFieldKey] = useState<string | null>(null)
  const [dragOverFieldKey, setDragOverFieldKey] = useState<string | null>(null)

  const formError =
    getErrorMessage(actionState.result.serverError) ??
    getFormError(actionState.result.validationErrors) ??
    getFieldError(actionState.result.validationErrors, "id")
  const handleSubmit = form.handleSubmit(
    async (formValues) => {
      const orderedFormValues = orderProfileFields(formValues)
      const result = await actionState.executeAsync(orderedFormValues as never)
      const actionResult = result as {
        serverError?: unknown
        validationErrors?: unknown
      } | undefined

      if (actionResult?.serverError || actionResult?.validationErrors) {
        console.error("Customer type form action error", {
          result,
          formValues: orderedFormValues,
        })
      }

      return result
    },
    (errors) => {
      console.error("Customer type form client validation error", {
        errors,
        formValues: form.getValues(),
      })
      toast.error(getFirstClientValidationError(errors) ?? "请先修正表单中的错误")
    },
  )

  const moveProfileField = (activeFieldKey: string, overFieldKey: string) => {
    if (activeFieldKey === overFieldKey) {
      return
    }

    const activeIndex = profileFields.fields.findIndex((field) => (
      (field as { formKey: string }).formKey === activeFieldKey
    ))
    const overIndex = profileFields.fields.findIndex((field) => (
      (field as { formKey: string }).formKey === overFieldKey
    ))

    if (activeIndex === -1 || overIndex === -1) {
      return
    }

    profileFields.move(activeIndex, overIndex)
  }

  const handleFieldDragStart = (event: DragEvent<HTMLElement>, fieldKey: string) => {
    setDraggingFieldKey(fieldKey)
    setDragOverFieldKey(fieldKey)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", fieldKey)
  }

  const handleFieldDragOver = (event: DragEvent<HTMLElement>, fieldKey: string) => {
    if (!draggingFieldKey) {
      return
    }

    event.preventDefault()
    if (dragOverFieldKey !== fieldKey) {
      setDragOverFieldKey(fieldKey)
    }
  }

  const handleFieldDrop = (event: DragEvent<HTMLElement>, fieldKey: string) => {
    event.preventDefault()
    const activeFieldKey = draggingFieldKey ?? event.dataTransfer.getData("text/plain")
    if (activeFieldKey) {
      moveProfileField(activeFieldKey, fieldKey)
    }
    setDraggingFieldKey(null)
    setDragOverFieldKey(null)
  }

  const handleFieldDragEnd = () => {
    setDraggingFieldKey(null)
    setDragOverFieldKey(null)
  }

  return (
    <form id={id} onSubmit={handleSubmit} className="max-w-3xl space-y-5" noValidate>
      {formError ? (
        <Field data-invalid>
          <FieldContent>
            <FieldError>{formError}</FieldError>
          </FieldContent>
        </Field>
      ) : null}

      {value?.id ? (
        <input type="hidden" {...form.register("id", { setValueAs: normalizePositiveInt })} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <Field data-invalid={Boolean(form.formState.errors.name) || undefined}>
          <FieldContent>
            <FieldLabel htmlFor="name">类型名称</FieldLabel>
            <Input id="name" required {...form.register("name")} />
            <FieldError>{getErrorMessage(form.formState.errors.name?.message) ?? null}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.sortOrder) || undefined}>
          <FieldContent>
            <FieldLabel htmlFor="sortOrder">排序</FieldLabel>
            <Input
              id="sortOrder"
              type="number"
              step={1}
              {...form.register("sortOrder", { setValueAs: normalizeNumberInput })}
            />
            <FieldError>{getErrorMessage(form.formState.errors.sortOrder?.message) ?? null}</FieldError>
          </FieldContent>
        </Field>
      </div>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="description">类型说明</FieldLabel>
          <Textarea id="description" {...form.register("description")} />
        </FieldContent>
      </Field>

      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4" {...form.register("enabled")} />
          启用
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4" {...form.register("supportsOpportunity")} />
          支持销售机会
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium">画像字段</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => profileFields.append({
              name: "",
              description: "",
              enabled: true,
              sortOrder: profileFields.fields.length,
            } as never)}
          >
            <PlusIcon className="size-4" />
            新增字段
          </Button>
        </div>

        <div className="space-y-2">
          {profileFields.fields.map((field, index) => {
            const fieldIdPath = `profileFields.${index}.id` as const
            const fieldId = form.getValues(fieldIdPath)
            const formKey = (field as { formKey: string }).formKey
            const fieldErrors = form.formState.errors.profileFields
            const nameError = getErrorAtPath(fieldErrors, [index, "name"])
            const descriptionError = getErrorAtPath(fieldErrors, [index, "description"])
            const sortOrderError = getErrorAtPath(fieldErrors, [index, "sortOrder"])

            return (
              <div
                key={formKey}
                className={`rounded-lg border p-3 ${
                  draggingFieldKey === formKey ? "opacity-50" : ""
                } ${dragOverFieldKey === formKey ? "border-primary" : ""}`}
                data-invalid={Boolean(nameError || descriptionError || sortOrderError) || undefined}
                onDragOver={(event) => handleFieldDragOver(event, formKey)}
                onDrop={(event) => handleFieldDrop(event, formKey)}
              >
                {fieldId ? (
                  <input
                    type="hidden"
                    {...form.register(fieldIdPath, { setValueAs: normalizePositiveInt })}
                  />
                ) : null}
                <input
                  type="hidden"
                  {...form.register(`profileFields.${index}.sortOrder` as const, { setValueAs: normalizeNumberInput })}
                />
                <div className="grid gap-3 md:grid-cols-[auto_1fr_1fr_auto]">
                  <button
                    type="button"
                    aria-label="拖拽排序画像字段"
                    draggable
                    onDragStart={(event) => handleFieldDragStart(event, formKey)}
                    onDragEnd={handleFieldDragEnd}
                    className="text-muted-foreground mt-2 shrink-0 cursor-grab active:cursor-grabbing"
                  >
                    <GripVerticalIcon className="size-4" />
                  </button>
                  <div className="space-y-1">
                    <Input
                      placeholder="字段名称"
                      aria-invalid={Boolean(nameError) || undefined}
                      {...form.register(`profileFields.${index}.name` as const)}
                    />
                    {nameError ? <p className="text-destructive text-xs">{nameError}</p> : null}
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="字段描述"
                      aria-invalid={Boolean(descriptionError) || undefined}
                      {...form.register(`profileFields.${index}.description` as const)}
                    />
                    {descriptionError ? <p className="text-destructive text-xs">{descriptionError}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="size-4" {...form.register(`profileFields.${index}.enabled` as const)} />
                      启用
                    </label>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => profileFields.remove(index)}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </form>
  )
}
