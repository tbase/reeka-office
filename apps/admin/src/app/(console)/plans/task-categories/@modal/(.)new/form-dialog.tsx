"use client"

import { useRouter } from "next/navigation"

import type { PlanTaskCategoryFormAction } from "@/actions/plans/task-category-actions"
import { PlanFormDialog } from "@/components/plans/form-dialog"
import { PlanTaskCategoryForm } from "@/components/plans/plan-task-category-form"

export function PlanTaskCategoryCreateFormDialog({
  action,
}: {
  action: PlanTaskCategoryFormAction
}) {
  const router = useRouter()

  return (
    <PlanFormDialog
      title="新增任务分类"
      description="每行一个分类名称，提交后批量创建。"
      formId="plan-task-category-form"
      submitLabel="批量创建分类"
    >
      <PlanTaskCategoryForm
        action={action}
        id="plan-task-category-form"
        redirectTo="/plans/task-categories"
        onSuccess={() => router.back()}
      />
    </PlanFormDialog>
  )
}
