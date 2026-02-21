"use client"

import { useState } from "react"
import type { RedemptionProductRow } from "@reeka-office/domain-point"

import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { ImageUpload } from "@/components/ui/image-upload"
import { Input } from "@/components/ui/input"
import { LinkButton } from "@/components/ui/link-button"
import { SubmitButton } from "@/components/ui/submit-button"
import { Textarea } from "@/components/ui/textarea"

function toDatetimeLocal(value: Date | null): string {
  if (!value) {
    return ""
  }

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  const hours = String(value.getHours()).padStart(2, "0")
  const minutes = String(value.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function ProductForm({
  action,
  submitLabel,
  cancelHref,
  value,
}: {
  action: (formData: FormData) => void | Promise<void>
  submitLabel: string
  cancelHref: string
  value?: RedemptionProductRow
}) {
  const [imageUrl, setImageUrl] = useState(value?.imageUrl ?? "")

  return (
    <form action={action} className="max-w-xl space-y-4">
      {value?.id ? <input type="hidden" name="id" value={String(value.id)} /> : null}

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="redeemCategory">兑换类别</FieldLabel>
          <Input id="redeemCategory" name="redeemCategory" defaultValue={value?.redeemCategory ?? ""} required />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="title">兑换标题</FieldLabel>
          <Input id="title" name="title" defaultValue={value?.title ?? ""} required />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel>商品图片</FieldLabel>
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <ImageUpload value={imageUrl} alt="商品图片" onChangeAction={setImageUrl} />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="description">兑换说明</FieldLabel>
          <Textarea id="description" name="description" rows={3} defaultValue={value?.description ?? ""} />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="notice">兑换须知</FieldLabel>
          <Textarea id="notice" name="notice" rows={3} defaultValue={value?.notice ?? ""} />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="validUntil">有效期至</FieldLabel>
          <Input
            id="validUntil"
            name="validUntil"
            type="datetime-local"
            defaultValue={toDatetimeLocal(value?.validUntil ?? null)}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="stock">库存</FieldLabel>
          <Input id="stock" name="stock" type="number" min={0} step={1} defaultValue={value?.stock ?? 0} required />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="redeemPoints">兑换积分</FieldLabel>
          <Input
            id="redeemPoints"
            name="redeemPoints"
            type="number"
            min={1}
            step={1}
            defaultValue={value?.redeemPoints ?? 1}
            required
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="maxRedeemPerAgent">每人可兑换次数</FieldLabel>
          <Input
            id="maxRedeemPerAgent"
            name="maxRedeemPerAgent"
            type="number"
            min={1}
            step={1}
            defaultValue={value?.maxRedeemPerAgent ?? 1}
            required
          />
          <FieldDescription>发布后关键字段不可修改，只允许下架。</FieldDescription>
        </FieldContent>
      </Field>

      <div className="flex gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <LinkButton href={cancelHref} variant="ghost">取消</LinkButton>
      </div>
    </form>
  )
}
