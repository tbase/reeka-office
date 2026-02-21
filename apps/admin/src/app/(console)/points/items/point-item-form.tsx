import type { PointItemRow } from "@reeka-office/domain-point"

import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LinkButton } from "@/components/ui/link-button"
import { SubmitButton } from "@/components/ui/submit-button"

export function PointItemForm({
  action,
  submitLabel,
  cancelHref,
  value,
}: {
  action: (formData: FormData) => void | Promise<void>
  submitLabel: string
  cancelHref: string
  value?: PointItemRow
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      {value?.id ? <input type="hidden" name="id" value={String(value.id)} /> : null}

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="name">事项名称</FieldLabel>
          <Input id="name" name="name" defaultValue={value?.name ?? ""} placeholder="例如：新人招募" required />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="category">事项类别</FieldLabel>
          <Input id="category" name="category" defaultValue={value?.category ?? ""} placeholder="例如：招募" required />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="pointAmount">积分金额</FieldLabel>
          <Input
            id="pointAmount"
            name="pointAmount"
            type="number"
            min={1}
            step={1}
            defaultValue={value?.pointAmount ?? ""}
            placeholder="留空表示发放时手填"
          />
          <FieldDescription>留空时，新增代理人积分时必须填写积分值。</FieldDescription>
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="annualLimit">每年次数上限</FieldLabel>
          <Input
            id="annualLimit"
            name="annualLimit"
            type="number"
            min={1}
            step={1}
            defaultValue={value?.annualLimit ?? ""}
            placeholder="留空表示不限"
          />
        </FieldContent>
      </Field>

      <div className="flex gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <LinkButton href={cancelHref} variant="ghost">取消</LinkButton>
      </div>
    </form>
  )
}
