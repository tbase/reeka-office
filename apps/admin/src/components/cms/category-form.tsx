"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller } from "react-hook-form"
import { toast } from "sonner"
import type { ZodType } from "zod"

import type { FieldSchemaItem } from "@reeka-office/domain-cms"

import type { CategoryFormAction } from "@/actions/cms/category-actions"
import { FieldSchemaEditor } from "@/components/cms/field-schema-editor"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type CategoryFormValue = {
  id?: number
  name?: string
  slug?: string
  description?: string | null
  hideContent?: boolean
  fieldSchema?: FieldSchemaItem[]
}

function getFieldError(
  validationErrors: unknown,
  fieldName: string,
) {
  if (!validationErrors || typeof validationErrors !== "object") {
    return undefined
  }

  const fieldError = (validationErrors as Record<string, unknown>)[fieldName]
  if (!fieldError || typeof fieldError !== "object" || Array.isArray(fieldError)) {
    return undefined
  }

  const errors = (fieldError as { _errors?: unknown })._errors
  return Array.isArray(errors) && typeof errors[0] === "string"
    ? errors[0]
    : undefined
}

function getFormError(validationErrors: unknown) {
  if (!validationErrors || typeof validationErrors !== "object") {
    return undefined
  }

  const errors = (validationErrors as { _errors?: unknown })._errors
  return Array.isArray(errors) && typeof errors[0] === "string"
    ? errors[0]
    : undefined
}

function getErrorMessage(value: unknown) {
  return typeof value === "string" ? value : undefined
}

export function CategoryForm<TAction extends CategoryFormAction, TSchema extends ZodType>({
  action,
  schema,
  value,
  id,
  onSuccess,
}: {
  action: TAction
  schema: TSchema
  value?: CategoryFormValue
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
          slug: value?.slug ?? "",
          description: value?.description ?? "",
          hideContent: value?.hideContent ?? false,
          fieldSchema: value?.fieldSchema ?? [],
        },
      },
      actionProps: {
        onSuccess: () => {
          const isCreate = !value?.id
          toast.success(isCreate ? "分类已创建" : "分类已保存")
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

  const formError =
    getErrorMessage(actionState.result.serverError) ??
    getFormError(actionState.result.validationErrors) ??
    getFieldError(actionState.result.validationErrors, "id")

  return (
    <form id={id} onSubmit={handleSubmitWithAction} className="space-y-4">
      {formError ? (
        <Field data-invalid>
          <FieldContent>
            <FieldError>{formError}</FieldError>
          </FieldContent>
        </Field>
      ) : null}

      <Field data-invalid={Boolean(form.formState.errors.name) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="name">分类名称</FieldLabel>
          <Input
            id="name"
            placeholder="分类名称"
            required
            {...form.register("name")}
          />
          <FieldError>{getErrorMessage(form.formState.errors.name?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.slug) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="slug">Slug</FieldLabel>
          <Input
            id="slug"
            placeholder="slug（可选）"
            {...form.register("slug")}
          />
          <FieldDescription>可留空，系统将按规则处理。</FieldDescription>
          <FieldError>{getErrorMessage(form.formState.errors.slug?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.description) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="description">分类描述</FieldLabel>
          <Textarea
            id="description"
            placeholder="分类描述（可选）"
            {...form.register("description")}
          />
          <FieldError>{getErrorMessage(form.formState.errors.description?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Controller
        control={form.control}
        name="hideContent"
        render={({ field }) => (
          <Field>
            <FieldContent>
              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
                <span>隐藏正文</span>
              </label>
              <FieldDescription>
                开启后，编辑该分类下的内容时不显示正文字段。
              </FieldDescription>
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="fieldSchema"
        render={({ field }) => (
          <Field>
            <FieldContent>
              <FieldLabel>字段定义</FieldLabel>
              <FieldSchemaEditor
                defaultValue={field.value}
                onChange={(items) => field.onChange(items)}
              />
            </FieldContent>
          </Field>
        )}
      />
    </form>
  )
}
