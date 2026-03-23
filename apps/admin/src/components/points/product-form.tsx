"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller } from "react-hook-form"
import { toast } from "sonner"
import type { ZodType } from "zod"

import type { RedemptionProductRow } from "@reeka-office/domain-point"

import type { ProductFormAction } from "@/actions/points/product-actions"
import {
  getErrorMessage,
  getFieldError,
  getFormError,
} from "@/components/points/form-errors"
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

function normalizeRequiredNumberInput(value: unknown) {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : undefined
}

function normalizeOptionalNumberInput(value: unknown) {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : undefined
}

export function ProductForm<TAction extends ProductFormAction, TSchema extends ZodType>({
  action,
  schema,
  value,
  id,
  onSuccess,
}: {
  action: TAction
  schema: TSchema
  value?: Partial<ProductFormValue>
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
          redeemCategory: value?.redeemCategory ?? "",
          title: value?.title ?? "",
          description: value?.description ?? "",
          notice: value?.notice ?? "",
          imageUrl: value?.imageUrl ?? "",
          validPeriodMonths: value?.validPeriodMonths ?? undefined,
          stock: value?.stock ?? 0,
          redeemPoints: value?.redeemPoints ?? 1,
          maxRedeemPerAgent: value?.maxRedeemPerAgent ?? 1,
        },
      },
      actionProps: {
        onSuccess: () => {
          const isCreate = !value?.id
          toast.success(isCreate ? "商品已创建" : "商品已保存")
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

      <Field data-invalid={Boolean(form.formState.errors.redeemCategory) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="redeemCategory">兑换类别</FieldLabel>
          <Input
            id="redeemCategory"
            required
            {...form.register("redeemCategory")}
          />
          <FieldError>
            {getErrorMessage(form.formState.errors.redeemCategory?.message) ?? null}
          </FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.title) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="title">兑换标题</FieldLabel>
          <Input
            id="title"
            required
            {...form.register("title")}
          />
          <FieldError>{getErrorMessage(form.formState.errors.title?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel>商品图片</FieldLabel>
          <Controller
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <ImageUpload
                directory="points"
                value={field.value ?? ""}
                alt="商品图片"
                onChangeAction={field.onChange}
                onError={(error) => {
                  toast.error(error.message)
                }}
              />
            )}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="description">兑换说明</FieldLabel>
          <Textarea
            id="description"
            rows={3}
            {...form.register("description")}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="notice">兑换须知</FieldLabel>
          <Textarea
            id="notice"
            rows={3}
            {...form.register("notice")}
          />
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.validPeriodMonths) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="validPeriodMonths">有效期（月）</FieldLabel>
          <Input
            id="validPeriodMonths"
            type="number"
            min={1}
            step={1}
            placeholder="留空表示不限"
            {...form.register("validPeriodMonths", {
              setValueAs: normalizeOptionalNumberInput,
            })}
          />
          <FieldDescription>
            填写后表示自发布起生效月数；留空表示不限。
          </FieldDescription>
          <FieldError>
            {getErrorMessage(form.formState.errors.validPeriodMonths?.message) ?? null}
          </FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.stock) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="stock">库存</FieldLabel>
          <Input
            id="stock"
            type="number"
            min={0}
            step={1}
            required
            {...form.register("stock", {
              setValueAs: normalizeRequiredNumberInput,
            })}
          />
          <FieldError>{getErrorMessage(form.formState.errors.stock?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.redeemPoints) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="redeemPoints">兑换积分</FieldLabel>
          <Input
            id="redeemPoints"
            type="number"
            min={1}
            step={1}
            required
            {...form.register("redeemPoints", {
              setValueAs: normalizeRequiredNumberInput,
            })}
          />
          <FieldError>
            {getErrorMessage(form.formState.errors.redeemPoints?.message) ?? null}
          </FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.maxRedeemPerAgent) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="maxRedeemPerAgent">每人可兑换次数</FieldLabel>
          <Input
            id="maxRedeemPerAgent"
            type="number"
            min={1}
            step={1}
            required
            {...form.register("maxRedeemPerAgent", {
              setValueAs: normalizeRequiredNumberInput,
            })}
          />
          <FieldDescription>
            发布后关键字段不可修改，只允许下架。
          </FieldDescription>
          <FieldError>
            {getErrorMessage(form.formState.errors.maxRedeemPerAgent?.message) ?? null}
          </FieldError>
        </FieldContent>
      </Field>
    </form>
  )
}
