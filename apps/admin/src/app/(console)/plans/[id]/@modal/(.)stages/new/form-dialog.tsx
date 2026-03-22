"use client"

import { useRouter } from "next/navigation"

import type { PlanStageFormAction } from "@/actions/plans/stage-actions"
import { PlanFormDialog } from "@/components/plans/form-dialog"
import { PlanStageForm } from "@/components/plans/plan-stage-form"

export function PlanStageCreateFormDialog({
  action,
  planId,
  planName,
}: {
  action: PlanStageFormAction
  planId: number
  planName: string
}) {
  const router = useRouter()

  return (
    <PlanFormDialog
      title="新增阶段"
      description={`当前计划：${planName}。每行一个阶段标题。`}
      formId="plan-stage-form"
      submitLabel="批量创建阶段"
    >
      <PlanStageForm
        action={action}
        id="plan-stage-form"
        redirectTo={`/plans/${planId}`}
        value={{ planId }}
        onSuccess={() => router.back()}
      />
    </PlanFormDialog>
  )
}
