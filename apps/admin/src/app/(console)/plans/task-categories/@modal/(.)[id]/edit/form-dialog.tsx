"use client"

import { useRouter } from "next/navigation"

import type { PlanTaskCategoryFormAction } from "@/actions/plans/task-category-actions"
import { PlanFormDialog } from "@/components/plans/form-dialog"
import { PlanTaskCategoryForm } from "@/components/plans/plan-task-category-form"

export function PlanTaskCategoryEditFormDialog({
  action,
  category,
}: {
  action: PlanTaskCategoryFormAction
  category: {
    id: number
    name: string
  }
}) {
  const router = useRouter()

  return (
    <PlanFormDialog
      title="编辑任务分类"
      description="修改任务分类名称。"
      formId="plan-task-category-form"
      submitLabel="保存分类"
    >
      <PlanTaskCategoryForm
        action={action}
        id="plan-task-category-form"
        value={category}
        onSuccess={() => router.back()}
      />
    </PlanFormDialog>
  )
}
