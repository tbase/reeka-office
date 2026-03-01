"use client"

import { useForm } from "@tanstack/react-form"
import { useState, useRef } from "react"
import { toast } from "sonner"

import type { RedemptionProductRow } from "@reeka-office/domain-point"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { ImageUpload } from "@/components/ui/image-upload"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type ProductFormValue = Pick<
  RedemptionProductRow,
  | "id"
  | "redeemCategory"
  | "title"
  | "imageUrl"
  | "description"
  | "notice"
  | "validPeriodMonths"
  | "stock"
  | "redeemPoints"
  | "maxRedeemPerAgent"
>

export function ProductForm({
  action,
  value,
  id,
  onSuccess,
}: {
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>
  value?: Partial<ProductFormValue>
  id?: string
  onSuccess?: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [imageUrl, setImageUrl] = useState(value?.imageUrl ?? "")

  const form = useForm({
    defaultValues: {
      redeemCategory: value?.redeemCategory ?? "",
      title: value?.title ?? "",
      description: value?.description ?? "",
      notice: value?.notice ?? "",
      validPeriodMonths:
        value?.validPeriodMonths != null ? String(value.validPeriodMonths) : "",
      stock: value?.stock != null ? String(value.stock) : "0",
      redeemPoints:
        value?.redeemPoints != null ? String(value.redeemPoints) : "1",
      maxRedeemPerAgent:
        value?.maxRedeemPerAgent != null ? String(value.maxRedeemPerAgent) : "1",
    },
    onSubmit: async ({ value: formValue }) => {
      if (!formRef.current) return

      const formData = new FormData(formRef.current)
      formData.set("redeemCategory", formValue.redeemCategory)
      formData.set("title", formValue.title)
      formData.set("description", formValue.description)
      formData.set("notice", formValue.notice)
      formData.set("validPeriodMonths", formValue.validPeriodMonths)
      formData.set("stock", formValue.stock)
      formData.set("redeemPoints", formValue.redeemPoints)
      formData.set("maxRedeemPerAgent", formValue.maxRedeemPerAgent)
      formData.set("imageUrl", imageUrl)

      if (value?.id) {
        formData.set("id", String(value.id))
      }

      const result = await action(formData)
      if (result?.success) {
        const isCreate = !value?.id
        toast.success(isCreate ? "商品已创建" : "商品已保存")
        onSuccess?.()
      }
    },
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    await form.handleSubmit()
  }

  return (
    <form
      id={id}
      ref={formRef}
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4"
    >
      {value?.id ? (
        <input type="hidden" name="id" value={String(value.id)} />
      ) : null}

      <form.Field
        name="redeemCategory"
        validators={{
          onSubmit: ({ value: v }) =>
            v.trim().length > 0 ? undefined : "兑换类别不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>兑换类别</FieldLabel>
                <Input
                  id={field.name}
                  name="redeemCategory"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
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
        name="title"
        validators={{
          onSubmit: ({ value: v }) =>
            v.trim().length > 0 ? undefined : "兑换标题不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>兑换标题</FieldLabel>
                <Input
                  id={field.name}
                  name="title"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
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

      <Field>
        <FieldContent>
          <FieldLabel>商品图片</FieldLabel>
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <ImageUpload value={imageUrl} alt="商品图片" onChangeAction={setImageUrl} />
        </FieldContent>
      </Field>

      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>兑换说明</FieldLabel>
              <Textarea
                id={field.name}
                name="description"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={3}
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="notice">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>兑换须知</FieldLabel>
              <Textarea
                id={field.name}
                name="notice"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={3}
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="validPeriodMonths">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>有效期（月）</FieldLabel>
              <Input
                id={field.name}
                name="validPeriodMonths"
                type="number"
                min={1}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="留空表示不限"
              />
              <FieldDescription>
                填写后表示自发布起生效月数；留空表示不限。
              </FieldDescription>
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="stock">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>库存</FieldLabel>
              <Input
                id={field.name}
                name="stock"
                type="number"
                min={0}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="redeemPoints">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>兑换积分</FieldLabel>
              <Input
                id={field.name}
                name="redeemPoints"
                type="number"
                min={1}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="maxRedeemPerAgent">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>每人可兑换次数</FieldLabel>
              <Input
                id={field.name}
                name="maxRedeemPerAgent"
                type="number"
                min={1}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
              <FieldDescription>
                发布后关键字段不可修改，只允许下架。
              </FieldDescription>
            </FieldContent>
          </Field>
        )}
      </form.Field>
    </form>
  )
}
