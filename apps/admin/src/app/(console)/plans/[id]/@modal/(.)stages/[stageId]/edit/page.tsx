export const dynamic = "force-dynamic"

import { GetPlanQuery } from "@reeka-office/domain-plan"
import { PlanStageEditFormDialog } from "./form-dialog"

import { updatePlanStageAction } from "@/actions/plans/stage-actions"
import { getRequiredAdminContext } from "@/lib/admin-context"

function parseId(value: string, label: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`无效${label} ID`)
  }

  return id
}

export default async function PlanStageEditModalPage({
  params,
}: {
  params: Promise<{ id: string; stageId: string }>
}) {
  const { id: rawId, stageId: rawStageId } = await params
  const planId = parseId(rawId, "计划")
  const stageId = parseId(rawStageId, "阶段")

  await getRequiredAdminContext()
  const plan = await new GetPlanQuery({ id: planId }).query()
  const stage = plan?.stages.find((item) => item.id === stageId) ?? null

  if (!plan || !stage || plan.status === "archived") {
    return null
  }

  return (
    <PlanStageEditFormDialog
      action={updatePlanStageAction}
      planId={planId}
      planName={plan.name}
      stage={{
        id: stage.id,
        title: stage.title,
        description: stage.description,
      }}
    />
  )
}

