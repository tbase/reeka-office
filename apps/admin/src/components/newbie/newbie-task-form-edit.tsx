"use client"

import type { NewbieTaskCategoryRow, NewbieTaskStageRow } from "@reeka-office/domain-newbie"
import type { PointItemRow } from "@reeka-office/domain-point"

import type { NewbieTaskFormValue } from "./newbie-task-form"
import { NewbieTaskForm } from "./newbie-task-form"

export function NewbieTaskFormEdit({
  id,
  value,
  action,
  stages,
  categories,
  pointItems,
  onSuccess,
}: {
  id: string
  value: NewbieTaskFormValue & { id: number }
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>
  stages: NewbieTaskStageRow[]
  categories: NewbieTaskCategoryRow[]
  pointItems: PointItemRow[]
  onSuccess?: () => void
}) {
  return (
    <NewbieTaskForm
      action={action}
      id={id}
      value={value}
      stages={stages}
      categories={categories}
      pointItems={pointItems}
      showDisplayOrder={false}
      onSuccess={onSuccess}
    />
  )
}
