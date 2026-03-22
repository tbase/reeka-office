"use client"

import { useRouter } from "next/navigation"

import type { PlanTaskFormAction } from "@/actions/plans/task-actions"
import { PlanFormDialog } from "@/components/plans/form-dialog"
import { PlanTaskForm } from "@/components/plans/plan-task-form"
import type { SimpleSelectItem } from "@/components/ui/simple-select"

export function PlanTaskEditFormDialog({
  action,
  planId,
  planName,
  task,
  stageOptions,
  categoryOptions,
  pointItemOptions,
}: {
  action: PlanTaskFormAction
  planId: number
  planName: string
  task: {
    id: number
    stageId: number
    categoryId: number
    title: string
    description?: string | null
    taskType: "normal" | "metric"
    isRequired: boolean
    pointItemId?: number | null
  }
  stageOptions: SimpleSelectItem[]
  categoryOptions: SimpleSelectItem[]
  pointItemOptions: SimpleSelectItem[]
}) {
  const router = useRouter()

  return (
    <PlanFormDialog
      title="编辑任务"
      description={`当前计划：${planName}`}
      formId="plan-task-form"
      submitLabel="保存任务"
    >
      <PlanTaskForm
        action={action}
        id="plan-task-form"
        redirectTo={`/plans/${planId}`}
        onSuccess={() => router.back()}
        value={{
          id: task.id,
          planId,
          stageId: task.stageId,
          categoryId: task.categoryId,
          title: task.title,
          description: task.description,
          taskType: task.taskType,
          isRequired: task.isRequired,
          pointItemId: task.pointItemId,
        }}
        stageOptions={stageOptions}
        categoryOptions={categoryOptions}
        pointItemOptions={pointItemOptions}
      />
    </PlanFormDialog>
  )
}
