"use client"

import { useRouter } from "next/navigation"

import type { PlanFormAction } from "@/actions/plans/plan-actions"
import { PlanForm } from "@/components/plans/plan-form"
import { PlanFormDialog } from "@/components/plans/form-dialog"

export function PlanEditFormDialog({
  action,
  plan,
}: {
  action: PlanFormAction
  plan: {
    id: number
    name: string
    description?: string | null
  }
}) {
  const router = useRouter()

  return (
    <PlanFormDialog
      title="编辑计划信息"
      description="修改计划名称和说明。"
      formId="plan-form"
      submitLabel="保存计划"
    >
      <PlanForm
        action={action}
        id="plan-form"
        value={plan}
        onSuccess={() => router.back()}
      />
    </PlanFormDialog>
  )
}
