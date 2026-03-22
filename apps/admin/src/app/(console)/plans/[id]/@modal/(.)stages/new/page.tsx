import { PlanStageCreateFormDialog } from "./form-dialog"

export const dynamic = "force-dynamic"

import { GetPlanQuery } from "@reeka-office/domain-plan"

import { createPlanStageAction } from "@/actions/plans/stage-actions"
import { getRequiredAdminContext } from "@/lib/admin-context"

function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效计划 ID")
  }

  return id
}

export default async function PlanStageCreateModalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const planId = parseId(rawId)

  await getRequiredAdminContext()
  const plan = await new GetPlanQuery({ id: planId }).query()

  if (!plan || plan.status === "archived") {
    return null
  }

  return (
    <PlanStageCreateFormDialog
      action={createPlanStageAction}
      planId={planId}
      planName={plan.name}
    />
  )
}

