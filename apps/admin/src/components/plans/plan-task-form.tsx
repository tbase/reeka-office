"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller } from "react-hook-form"
import { toast } from "sonner"

import {
  createPlanTaskActionSchema,
  updatePlanTaskActionSchema,
} from "@/actions/plans/form-schemas"
import type { PlanTaskFormAction } from "@/actions/plans/task-actions"
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
import { SimpleSelect, type SimpleSelectItem } from "@/components/ui/simple-select"
import { Textarea } from "@/components/ui/textarea"

export type PlanTaskFormValue = {
  id?: number
  planId: number
  stageId?: number
  categoryId?: number
  title?: string
  description?: string | null
  taskType?: "normal" | "metric"
  isRequired?: boolean
  pointItemId?: number | null
}

export function PlanTaskForm<TAction extends PlanTaskFormAction>({
  action,
  value,
  stageOptions,
  categoryOptions,
  pointItemOptions,
  id,
  redirectTo,
  onSuccess,
}: {
  action: TAction
  value: PlanTaskFormValue
  stageOptions: SimpleSelectItem[]
  categoryOptions: SimpleSelectItem[]
  pointItemOptions: SimpleSelectItem[]
  id?: string
  redirectTo: string
  onSuccess?: () => void
}) {
  const router = useRouter()
  const schema = value.id ? updatePlanTaskActionSchema : createPlanTaskActionSchema

  const { form, action: actionState, handleSubmitWithAction } = useHookFormAction(
    action as never,
    zodResolver(schema),
    {
      formProps: {
        defaultValues: {
          id: value.id,
          planId: value.planId,
          stageId: value.stageId,
          categoryId: value.categoryId,
          title: value.title ?? "",
          description: value.description ?? "",
          taskType: value.taskType ?? "normal",
          isRequired: value.isRequired ?? false,
          pointItemId: value.pointItemId ?? undefined,
        },
      },
      actionProps: {
        onSuccess: () => {
          const isCreate = !value.id
          toast.success(isCreate ? "任务已创建" : "任务已保存")
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

  const taskType = form.watch("taskType")

  useEffect(() => {
    if (taskType === "metric") {
      form.setValue("isRequired", true)
    }
  }, [form, taskType])

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

      <Field
        data-invalid={
          Boolean(form.formState.errors.stageId) ||
          Boolean(getFieldError(actionState.result.validationErrors, "stageId")) ||
          undefined
        }
      >
        <FieldContent>
          <FieldLabel>所属阶段</FieldLabel>
          <Controller
            control={form.control}
            name="stageId"
            render={({ field }) => (
              <SimpleSelect
                required
                placeholder={stageOptions.length === 0 ? "暂无阶段" : "请选择阶段"}
                items={stageOptions}
                value={field.value ? String(field.value) : ""}
                onValueChange={(selected) => field.onChange(selected ? Number(selected) : undefined)}
              />
            )}
          />
          <FieldError>
            {getErrorMessage(form.formState.errors.stageId?.message) ??
              getFieldError(actionState.result.validationErrors, "stageId") ??
              null}
          </FieldError>
        </FieldContent>
      </Field>

      <Field
        data-invalid={
          Boolean(form.formState.errors.categoryId) ||
          Boolean(getFieldError(actionState.result.validationErrors, "categoryId")) ||
          undefined
        }
      >
        <FieldContent>
          <FieldLabel>任务分类</FieldLabel>
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <SimpleSelect
                required
                placeholder={categoryOptions.length === 0 ? "暂无可用分类" : "请选择任务分类"}
                items={categoryOptions}
                value={field.value ? String(field.value) : ""}
                onValueChange={(selected) => field.onChange(selected ? Number(selected) : undefined)}
              />
            )}
          />
          <FieldError>
            {getErrorMessage(form.formState.errors.categoryId?.message) ??
              getFieldError(actionState.result.validationErrors, "categoryId") ??
              null}
          </FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.title) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="title">任务标题</FieldLabel>
          <Input
            id="title"
            placeholder="例如：完成首月面谈"
            required
            {...form.register("title")}
          />
          <FieldError>{getErrorMessage(form.formState.errors.title?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.description) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="description">任务说明</FieldLabel>
          <Textarea
            id="description"
            rows={4}
            placeholder="填写任务的执行说明或验收要点"
            {...form.register("description")}
          />
          <FieldError>{getErrorMessage(form.formState.errors.description?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field
        data-invalid={
          Boolean(form.formState.errors.taskType) ||
          Boolean(getFieldError(actionState.result.validationErrors, "taskType")) ||
          undefined
        }
      >
        <FieldContent>
          <FieldLabel>任务类型</FieldLabel>
          <Controller
            control={form.control}
            name="taskType"
            render={({ field }) => (
              <SimpleSelect
                required
                items={[
                  { value: "normal", label: "普通任务" },
                  { value: "metric", label: "指标任务" },
                ]}
                value={field.value}
                onValueChange={(selected) => field.onChange(selected || "normal")}
              />
            )}
          />
          <FieldError>
            {getErrorMessage(form.formState.errors.taskType?.message) ??
              getFieldError(actionState.result.validationErrors, "taskType") ??
              null}
          </FieldError>
        </FieldContent>
      </Field>

      <Controller
        control={form.control}
        name="isRequired"
        render={({ field }) => (
          <Field>
            <FieldContent>
              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={taskType === "metric" ? true : Boolean(field.value)}
                  disabled={taskType === "metric"}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
                <span>
                  {taskType === "metric" ? "指标任务默认必做" : "设为必做任务"}
                </span>
              </label>
              <FieldDescription>
                必做任务会参与计划完成资格计算。
              </FieldDescription>
            </FieldContent>
          </Field>
        )}
      />

      <Field>
        <FieldContent>
          <FieldLabel>奖励积分事项</FieldLabel>
          <Controller
            control={form.control}
            name="pointItemId"
            render={({ field }) => (
              <SimpleSelect
                placeholder="不设置则完成任务不自动发积分"
                items={pointItemOptions}
                value={field.value ? String(field.value) : ""}
                onValueChange={(selected) => field.onChange(selected ? Number(selected) : undefined)}
              />
            )}
          />
          <FieldDescription>
            留空表示该任务完成后不自动发放积分。
          </FieldDescription>
        </FieldContent>
      </Field>
    </form>
  )
}
