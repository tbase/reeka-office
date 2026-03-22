export const dynamic = "force-dynamic"

import {
  GetPlanQuery,
  ListPlanTaskCategoriesQuery,
} from "@reeka-office/domain-plan"
import { ListPointItemsQuery } from "@reeka-office/domain-point"
import { PlanTaskCreateFormDialog } from "./form-dialog"

import { createPlanTaskAction } from "@/actions/plans/task-actions"
import { getRequiredAdminContext } from "@/lib/admin-context"

function parseId(value: string, label: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`无效${label} ID`)
  }

  return id
}

function parseOptionalId(value: string | undefined) {
  if (!value) {
    return null
  }

  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  return id
}

export default async function PlanTaskCreateModalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id: rawId } = await params
  const planId = parseId(rawId, "计划")
  const paramsRecord = (await searchParams) ?? {}
  const requestedStageId = parseOptionalId(
    typeof paramsRecord.stageId === "string" ? paramsRecord.stageId : undefined,
  )

  await getRequiredAdminContext()
  const [plan, taskCategories, pointItems] = await Promise.all([
    new GetPlanQuery({ id: planId }).query(),
    new ListPlanTaskCategoriesQuery().query(),
    new ListPointItemsQuery().query(),
  ])

  if (
    !plan ||
    plan.status === "archived" ||
    plan.stages.length === 0 ||
    taskCategories.length === 0
  ) {
    return null
  }

  const defaultStageId =
    requestedStageId && plan.stages.some((stage) => stage.id === requestedStageId)
      ? requestedStageId
      : plan.stages[0]?.id

  return (
    <PlanTaskCreateFormDialog
      action={createPlanTaskAction}
      planId={planId}
      planName={plan.name}
      defaultStageId={defaultStageId ?? undefined}
      stageOptions={plan.stages.map((stage) => ({
        value: String(stage.id),
        label: stage.title,
      }))}
      categoryOptions={taskCategories.map((category) => ({
        value: String(category.id),
        label: category.name,
      }))}
      pointItemOptions={pointItems.map((item) => ({
        value: String(item.id),
        label: `${item.category} / ${item.name}`,
      }))}
    />
  )
}

