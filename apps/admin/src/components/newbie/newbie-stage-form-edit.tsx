"use client"

import type { NewbieStageFormValue } from "./newbie-stage-form"
import { NewbieStageForm } from "./newbie-stage-form"

export function NewbieStageFormEdit({
  id,
  value,
  action,
  onSuccess,
}: {
  id: string
  value: NewbieStageFormValue & { id: number }
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>
  onSuccess?: () => void
}) {
  return (
    <NewbieStageForm
      action={action}
      id={id}
      value={value}
      onSuccess={onSuccess}
    />
  )
}
