"use client"

import type { PointItemFormValue } from "./point-item-form"
import { PointItemForm } from "./point-item-form"

export function PointItemFormEdit({
  id,
  value,
  action,
  onSuccess,
}: {
  id: string
  value: PointItemFormValue & { id: number }
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>
  onSuccess?: () => void
}) {
  return (
    <PointItemForm
      action={action}
      id={id}
      value={value}
      onSuccess={onSuccess}
    />
  )
}
