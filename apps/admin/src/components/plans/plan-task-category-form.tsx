"use client"

import { useRouter } from "next/navigation"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  createPlanTaskCategoryActionSchema,
  updatePlanTaskCategoryActionSchema,
} from "@/actions/plans/form-schemas"
import type { PlanTaskCategoryFormAction } from "@/actions/plans/task-category-actions"
import {
  getErrorMessage,
  getFieldError,
  getFormError,
} from "@/components/plans/form-errors"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type PlanTaskCategoryFormValue = {
  id?: number
  names?: string
  name?: string
}

export function PlanTaskCategoryForm<
  TAction extends PlanTaskCategoryFormAction,
>({
  action,
  value,
  id,
  redirectTo,
  onSuccess,
}: {
  action: TAction
  value?: PlanTaskCategoryFormValue
  id?: string
  redirectTo?: string
  onSuccess?: () => void
}) {
  const router = useRouter()
  const isCreate = !value?.id
  const schema = isCreate
    ? createPlanTaskCategoryActionSchema
    : updatePlanTaskCategoryActionSchema

  const { form, action: actionState, handleSubmitWithAction } = useHookFormAction(
    action as never,
    zodResolver(schema),
    {
      formProps: {
        defaultValues: {
          id: value?.id,
          names: value?.names ?? "",
          name: value?.name ?? "",
        },
      },
      actionProps: {
        onSuccess: ({ data }) => {
          const createdCount =
            typeof data === "object" &&
            data !== null &&
            "createdCount" in data &&
            typeof data.createdCount === "number"
              ? data.createdCount
              : 0

          toast.success(
            isCreate ? `已创建 ${createdCount} 个任务分类` : "任务分类已保存",
          )
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

      {isCreate ? (
        <Field data-invalid={Boolean(form.formState.errors.names) || undefined}>
          <FieldContent>
            <FieldLabel htmlFor="names">分类名称</FieldLabel>
            <Textarea
              id="names"
              rows={8}
              placeholder={"例如：培训打卡\n日常作业\n阶段评估"}
              required
              {...form.register("names")}
            />
            <FieldDescription>每行一个分类名称，提交后会按顺序批量创建。</FieldDescription>
            <FieldError>{getErrorMessage(form.formState.errors.names?.message) ?? null}</FieldError>
          </FieldContent>
        </Field>
      ) : (
        <Field data-invalid={Boolean(form.formState.errors.name) || undefined}>
          <FieldContent>
            <FieldLabel htmlFor="name">分类名称</FieldLabel>
            <Input
              id="name"
              placeholder="例如：培训打卡"
              required
              {...form.register("name")}
            />
            <FieldError>{getErrorMessage(form.formState.errors.name?.message) ?? null}</FieldError>
          </FieldContent>
        </Field>
      )}
    </form>
  )
}
