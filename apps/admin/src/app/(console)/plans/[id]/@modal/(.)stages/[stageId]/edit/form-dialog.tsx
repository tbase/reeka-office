"use client"

import { useRouter } from "next/navigation"

import type { PlanStageFormAction } from "@/actions/plans/stage-actions"
import { PlanFormDialog } from "@/components/plans/form-dialog"
import { PlanStageForm } from "@/components/plans/plan-stage-form"

export function PlanStageEditFormDialog({
  action,
  planId,
  planName,
  stage,
}: {
  action: PlanStageFormAction
  planId: number
  planName: string
  stage: {
    id: number
    title: string
    description?: string | null
  }
}) {
  const router = useRouter()

  return (
    <PlanFormDialog
      title="编辑阶段"
      description={`当前计划：${planName}`}
      formId="plan-stage-form"
      submitLabel="保存阶段"
    >
      <PlanStageForm
        action={action}
        id="plan-stage-form"
        redirectTo={`/plans/${planId}`}
        value={{
          id: stage.id,
          planId,
          title: stage.title,
          description: stage.description,
        }}
        onSuccess={() => router.back()}
      />
    </PlanFormDialog>
  )
}
