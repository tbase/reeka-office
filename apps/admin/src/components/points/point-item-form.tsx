"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { ZodType } from "zod"

import type { PointItemFormAction } from "@/actions/points/item-actions"
import {
  getErrorMessage,
  getFieldError,
  getFormError,
} from "@/components/points/form-errors"

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export type PointItemFormValue = {
  id?: number
  name?: string
  category?: string
  pointAmount?: number | null
  annualLimit?: number | null
}

function normalizeOptionalNumberInput(value: unknown) {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : undefined
}

export function PointItemForm<TAction extends PointItemFormAction, TSchema extends ZodType>({
  action,
  schema,
  value,
  id,
  onSuccess,
}: {
  action: TAction
  schema: TSchema
  value?: PointItemFormValue
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
          category: value?.category ?? "",
          pointAmount: value?.pointAmount ?? undefined,
          annualLimit: value?.annualLimit ?? undefined,
        },
      },
      actionProps: {
        onSuccess: () => {
          const isCreate = !value?.id
          toast.success(isCreate ? "积分事项已创建" : "积分事项已保存")
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
    <form id={id} onSubmit={handleSubmitWithAction} className="max-w-xl space-y-4">
      {formError ? (
        <Field data-invalid>
          <FieldContent>
            <FieldError>{formError}</FieldError>
          </FieldContent>
        </Field>
      ) : null}

      <Field data-invalid={Boolean(form.formState.errors.name) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="name">事项名称</FieldLabel>
          <Input
            id="name"
            placeholder="例如：新人招募"
            required
            {...form.register("name")}
          />
          <FieldError>{getErrorMessage(form.formState.errors.name?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.category) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="category">事项类别</FieldLabel>
          <Input
            id="category"
            placeholder="例如：招募"
            required
            {...form.register("category")}
          />
          <FieldError>{getErrorMessage(form.formState.errors.category?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.pointAmount) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="pointAmount">积分金额</FieldLabel>
          <Input
            id="pointAmount"
            type="number"
            min={1}
            step={1}
            placeholder="留空表示发放时手填"
            {...form.register("pointAmount", {
              setValueAs: normalizeOptionalNumberInput,
            })}
          />
          <FieldError>{getErrorMessage(form.formState.errors.pointAmount?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.annualLimit) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="annualLimit">每年次数上限</FieldLabel>
          <Input
            id="annualLimit"
            type="number"
            min={1}
            step={1}
            placeholder="留空表示不限"
            {...form.register("annualLimit", {
              setValueAs: normalizeOptionalNumberInput,
            })}
          />
          <FieldError>{getErrorMessage(form.formState.errors.annualLimit?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>
    </form>
  )
}
