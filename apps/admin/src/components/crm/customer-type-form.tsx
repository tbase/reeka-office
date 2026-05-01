"use client"

import { useFieldArray } from "react-hook-form"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, Trash2Icon } from "lucide-react"
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

function normalizeNumberInput(value: unknown) {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : 0
}

function normalizeOptionalId(value: unknown) {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : undefined
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
  const { form, action: actionState, handleSubmitWithAction } = useHookFormAction(
    action as never,
    zodResolver(schema as never),
    {
      formProps: {
        defaultValues: {
          id: value?.id,
          name: value?.name ?? "",
          description: value?.description ?? "",
          enabled: value?.enabled ?? true,
          supportsOpportunity: value?.supportsOpportunity ?? false,
          sortOrder: value?.sortOrder ?? 0,
          profileFields: value?.profileFields?.length
            ? value.profileFields.map((field) => ({
                id: field.id,
                name: field.name ?? "",
                description: field.description ?? "",
                enabled: field.enabled ?? true,
                sortOrder: field.sortOrder ?? 0,
              }))
            : [],
        },
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
  })

  const formError =
    getErrorMessage(actionState.result.serverError) ??
    getFormError(actionState.result.validationErrors) ??
    getFieldError(actionState.result.validationErrors, "id")

  return (
    <form id={id} onSubmit={handleSubmitWithAction} className="max-w-3xl space-y-5">
      {formError ? (
        <Field data-invalid>
          <FieldContent>
            <FieldError>{formError}</FieldError>
          </FieldContent>
        </Field>
      ) : null}

      {value?.id ? (
        <input type="hidden" {...form.register("id", { setValueAs: normalizeOptionalId })} />
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
          {profileFields.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border p-3">
              <input
                type="hidden"
                {...form.register(`profileFields.${index}.id` as const, { setValueAs: normalizeOptionalId })}
              />
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_96px_auto]">
                <Input
                  placeholder="字段名称"
                  {...form.register(`profileFields.${index}.name` as const)}
                />
                <Input
                  placeholder="字段描述"
                  {...form.register(`profileFields.${index}.description` as const)}
                />
                <Input
                  type="number"
                  step={1}
                  {...form.register(`profileFields.${index}.sortOrder` as const, { setValueAs: normalizeNumberInput })}
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4" {...form.register(`profileFields.${index}.enabled` as const)} />
                    启用
                  </label>
                  {form.getValues(`profileFields.${index}.id` as const) ? null : (
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => profileFields.remove(index)}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </form>
  )
}
