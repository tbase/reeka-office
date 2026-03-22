"use client"

import { useRouter } from "next/navigation"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  createPlanStageActionSchema,
  updatePlanStageActionSchema,
} from "@/actions/plans/form-schemas"
import type { PlanStageFormAction } from "@/actions/plans/stage-actions"
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

export type PlanStageFormValue = {
  id?: number
  planId: number
  titles?: string
  title?: string
  description?: string | null
}

export function PlanStageForm<TAction extends PlanStageFormAction>({
  action,
  value,
  id,
  redirectTo,
  onSuccess,
}: {
  action: TAction
  value: PlanStageFormValue
  id?: string
  redirectTo: string
  onSuccess?: () => void
}) {
  const router = useRouter()
  const isCreate = !value.id
  const schema = isCreate ? createPlanStageActionSchema : updatePlanStageActionSchema

  const { form, action: actionState, handleSubmitWithAction } = useHookFormAction(
    action as never,
    zodResolver(schema),
    {
      formProps: {
        defaultValues: {
          id: value.id,
          planId: value.planId,
          titles: value.titles ?? "",
          title: value.title ?? "",
          description: value.description ?? "",
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
            isCreate ? `已创建 ${createdCount} 个阶段` : "阶段已保存",
          )
          if (onSuccess) {
            onSuccess()
          } else {
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
        <Field data-invalid={Boolean(form.formState.errors.titles) || undefined}>
          <FieldContent>
            <FieldLabel htmlFor="titles">阶段标题</FieldLabel>
            <Textarea
              id="titles"
              rows={8}
              placeholder={"例如：入门准备\n基础训练\n复盘总结"}
              required
              {...form.register("titles")}
            />
            <FieldDescription>每行一个阶段标题，提交后会按顺序批量创建。</FieldDescription>
            <FieldError>{getErrorMessage(form.formState.errors.titles?.message) ?? null}</FieldError>
          </FieldContent>
        </Field>
      ) : (
        <>
          <Field data-invalid={Boolean(form.formState.errors.title) || undefined}>
            <FieldContent>
              <FieldLabel htmlFor="title">阶段标题</FieldLabel>
              <Input
                id="title"
                placeholder="例如：入门准备"
                required
                {...form.register("title")}
              />
              <FieldError>{getErrorMessage(form.formState.errors.title?.message) ?? null}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(form.formState.errors.description) || undefined}>
            <FieldContent>
              <FieldLabel htmlFor="description">阶段说明</FieldLabel>
              <Textarea
                id="description"
                rows={4}
                placeholder="填写该阶段的目标或补充说明"
                {...form.register("description")}
              />
              <FieldError>{getErrorMessage(form.formState.errors.description?.message) ?? null}</FieldError>
            </FieldContent>
          </Field>
        </>
      )}
    </form>
  )
}
