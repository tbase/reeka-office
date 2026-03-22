"use client"

import { useRouter } from "next/navigation"

import type { PlanFormAction } from "@/actions/plans/plan-actions"
import { PlanForm } from "@/components/plans/plan-form"
import { PlanFormDialog } from "@/components/plans/form-dialog"

export function PlanCreateFormDialog({
  action,
}: {
  action: PlanFormAction
}) {
  const router = useRouter()

  return (
    <PlanFormDialog
      title="新增计划"
      description="先创建计划基础信息，后续再配置阶段和任务。"
      formId="plan-form"
      submitLabel="创建计划"
    >
      <PlanForm
        action={action}
        id="plan-form"
        redirectTo="/plans"
        onSuccess={() => router.back()}
      />
    </PlanFormDialog>
  )
}
