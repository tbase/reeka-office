"use client"

import { useRouter } from "next/navigation"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  createPlanActionSchema,
  updatePlanActionSchema,
} from "@/actions/plans/form-schemas"
import type { PlanFormAction } from "@/actions/plans/plan-actions"
import {
  getErrorMessage,
  getFieldError,
  getFormError,
} from "@/components/plans/form-errors"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type PlanFormValue = {
  id?: number
  name?: string
  description?: string | null
}

export function PlanForm<TAction extends PlanFormAction>({
  action,
  value,
  id,
  redirectTo,
  onSuccess,
  disabled = false,
}: {
  action: TAction
  value?: PlanFormValue
  id?: string
  redirectTo?: string
  onSuccess?: () => void
  disabled?: boolean
}) {
  const router = useRouter()
  const schema = value?.id ? updatePlanActionSchema : createPlanActionSchema

  const { form, action: actionState, handleSubmitWithAction } = useHookFormAction(
    action as never,
    zodResolver(schema),
    {
      formProps: {
        defaultValues: {
          id: value?.id,
          name: value?.name ?? "",
          description: value?.description ?? "",
        },
      },
      actionProps: {
        onSuccess: () => {
          const isCreate = !value?.id
          toast.success(isCreate ? "计划已创建" : "计划已保存")
          if (onSuccess) {
            onSuccess()
          } else if (redirectTo) {
            router.push(redirectTo)
          }
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
          <FieldLabel htmlFor="name">计划名称</FieldLabel>
          <Input
            id="name"
            placeholder="例如：新人启航计划"
            required
            disabled={disabled}
            {...form.register("name")}
          />
          <FieldError>{getErrorMessage(form.formState.errors.name?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.description) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="description">计划说明</FieldLabel>
          <Textarea
            id="description"
            rows={4}
            placeholder="填写计划的目标、适用对象和说明"
            disabled={disabled}
            {...form.register("description")}
          />
          <FieldError>{getErrorMessage(form.formState.errors.description?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>
    </form>
  )
}
