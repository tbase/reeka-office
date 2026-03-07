"use client"

import { useForm } from "@tanstack/react-form"
import type { NewbieTaskCategoryRow, NewbieTaskStageRow } from "@reeka-office/domain-newbie"
import type { PointItemRow } from "@reeka-office/domain-point"
import { useRef } from "react"
import { toast } from "sonner"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SimpleSelect } from "@/components/ui/simple-select"
import { Textarea } from "@/components/ui/textarea"

export type NewbieTaskFormValue = {
  id?: number
  title?: string
  description?: string | null
  stageId?: number
  categoryName?: string
  displayOrder?: number
  pointEventId?: number
  pointAmount?: number | null
}

export function NewbieTaskForm({
  action,
  value,
  stages,
  categories,
  pointItems,
  lockStageSelection,
  showDisplayOrder = true,
  prioritizeStageAndCategory = false,
  id,
  onSuccess,
}: {
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>
  value?: NewbieTaskFormValue
  stages: NewbieTaskStageRow[]
  categories: NewbieTaskCategoryRow[]
  pointItems: PointItemRow[]
  lockStageSelection?: boolean
  showDisplayOrder?: boolean
  prioritizeStageAndCategory?: boolean
  id?: string
  onSuccess?: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm({
    defaultValues: {
      title: value?.title ?? "",
      description: value?.description ?? "",
      stageId: value?.stageId != null ? String(value.stageId) : "",
      categoryName: value?.categoryName ?? "",
      displayOrder: value?.displayOrder != null ? String(value.displayOrder) : "0",
      pointEventId: value?.pointEventId != null ? String(value.pointEventId) : "",
      pointAmount: value?.pointAmount != null ? String(value.pointAmount) : "",
    },
    onSubmit: async ({ value: formValue }) => {
      if (!formRef.current) {
        return
      }

      const formData = new FormData(formRef.current)
      formData.set("title", formValue.title)
      formData.set("description", formValue.description)
      formData.set("stageId", formValue.stageId)
      formData.set("categoryName", formValue.categoryName)
      formData.set("displayOrder", formValue.displayOrder)
      formData.set("pointEventId", formValue.pointEventId)
      formData.set("pointAmount", formValue.pointAmount)

      if (value?.id) {
        formData.set("id", String(value.id))
      }

      const result = await action(formData)
      if (result?.success) {
        const isCreate = !value?.id
        toast.success(isCreate ? "任务已创建" : "任务已保存")
        onSuccess?.()
      }
    },
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    await form.handleSubmit()
  }

  const categoryItems = categories
    .map((category) => category.name)
    .filter((name, index, arr) => arr.indexOf(name) === index)
    .map((name) => ({ value: name, label: name }))

  const pointItemOptions = pointItems.map((item) => ({
    value: String(item.id),
    label: `${item.name}（${item.category}）`,
  }))

  return (
    <form
      id={id}
      ref={formRef}
      onSubmit={handleSubmit}
      className="max-w-xl flex flex-col gap-4"
    >
      {value?.id ? (
        <input type="hidden" name="id" value={String(value.id)} />
      ) : null}

      <form.Field
        name="title"
        validators={{
          onSubmit: ({ value: v }) =>
            v.trim().length > 0 ? undefined : "任务名称不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <Field
              data-invalid={hasError || undefined}
              className={prioritizeStageAndCategory ? "order-3" : "order-1"}
            >
              <FieldContent>
                <FieldLabel htmlFor={field.name}>任务名称</FieldLabel>
                <Input
                  id={field.name}
                  name="title"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="例如：完成首次签到"
                  required
                />
                <FieldError>
                  {hasError ? String(field.state.meta.errors[0]) : null}
                </FieldError>
              </FieldContent>
            </Field>
          )
        }}
      </form.Field>

      <form.Field
        name="stageId"
        validators={{
          onSubmit: ({ value: v }) =>
            Number.isInteger(Number(v)) && Number(v) > 0
              ? undefined
              : "请选择任务阶段",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <Field
              data-invalid={hasError || undefined}
              className={prioritizeStageAndCategory ? "order-1" : "order-2"}
            >
              <FieldContent>
                <FieldLabel>任务阶段</FieldLabel>
                <SimpleSelect
                  name="stageId"
                  required
                  disabled={lockStageSelection}
                  placeholder={stages.length === 0 ? "暂无任务阶段" : "请选择任务阶段"}
                  items={stages.map((stage) => ({
                    value: String(stage.id),
                    label: `${stage.stage} - ${stage.title}`,
                  }))}
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(String(v))}
                />
                <FieldError>
                  {hasError ? String(field.state.meta.errors[0]) : null}
                </FieldError>
                {lockStageSelection ? (
                  <FieldDescription>
                    已根据入口阶段锁定，如需修改请从任务管理页通用入口新增。
                  </FieldDescription>
                ) : null}
              </FieldContent>
            </Field>
          )
        }}
      </form.Field>

      <form.Field
        name="categoryName"
        validators={{
          onSubmit: ({ value: v }) =>
            v.trim().length > 0 ? undefined : "任务分类不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <Field
              data-invalid={hasError || undefined}
              className={prioritizeStageAndCategory ? "order-2" : "order-3"}
            >
              <FieldContent>
                <FieldLabel>任务分类</FieldLabel>
                <SimpleSelect
                  name="categoryName"
                  required
                  placeholder={categoryItems.length === 0 ? "暂无任务分类" : "请选择任务分类"}
                  items={categoryItems}
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(String(v))}
                />
                {categoryItems.length > 0 ? (
                  <FieldDescription>
                    支持从已有分类中选择。
                  </FieldDescription>
                ) : (
                  <FieldDescription>当前暂无分类，请先在任务管理页创建分类。</FieldDescription>
                )}
                <FieldError>
                  {hasError ? String(field.state.meta.errors[0]) : null}
                </FieldError>
              </FieldContent>
            </Field>
          )
        }}
      </form.Field>

      {showDisplayOrder ? (
        <form.Field name="displayOrder">
          {(field) => (
            <Field className="order-4">
              <FieldContent>
                <FieldLabel htmlFor={field.name}>展示顺序</FieldLabel>
                <Input
                  id={field.name}
                  name="displayOrder"
                  type="number"
                  min={0}
                  step={1}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="默认 0，越小越靠前"
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>
      ) : null}

      <form.Field
        name="pointEventId"
        validators={{
          onSubmit: ({ value: v }) =>
            Number.isInteger(Number(v)) && Number(v) > 0
              ? undefined
              : "请选择积分事项",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <Field data-invalid={hasError || undefined} className={showDisplayOrder ? "order-5" : "order-4"}>
              <FieldContent>
                <FieldLabel>积分事项</FieldLabel>
                <SimpleSelect
                  name="pointEventId"
                  required
                  placeholder={pointItemOptions.length === 0 ? "暂无积分事项" : "请选择积分事项"}
                  items={pointItemOptions}
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(String(v))}
                />
                <FieldError>
                  {hasError ? String(field.state.meta.errors[0]) : null}
                </FieldError>
                {pointItemOptions.length > 0 ? (
                  <FieldDescription>从积分事项列表中选择，任务完成后按所选事项发放积分。</FieldDescription>
                ) : (
                  <FieldDescription>当前暂无积分事项，请先在积分管理中新增事项。</FieldDescription>
                )}
              </FieldContent>
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="pointAmount">
        {(field) => (
          <Field className={showDisplayOrder ? "order-6" : "order-5"}>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>积分值（可选）</FieldLabel>
              <Input
                id={field.name}
                name="pointAmount"
                type="number"
                min={1}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="留空表示按积分事项规则处理"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <Field className={showDisplayOrder ? "order-7" : "order-6"}>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>任务说明</FieldLabel>
              <Textarea
                id={field.name}
                name="description"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="可选，填写该任务的完成要求"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>
    </form>
  )
}
