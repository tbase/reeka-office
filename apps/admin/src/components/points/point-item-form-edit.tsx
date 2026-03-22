"use client"

import type { UpdatePointItemAction } from "@/actions/points/item-actions"
import { updatePointItemActionSchema } from "@/actions/points/form-schemas"

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
  action: UpdatePointItemAction
  onSuccess?: () => void
}) {
  return (
    <PointItemForm
      action={action}
      schema={updatePointItemActionSchema}
      id={id}
      value={value}
      onSuccess={onSuccess}
    />
  )
}
