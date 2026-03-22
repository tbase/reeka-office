export const dynamic = "force-dynamic"

import {
  GetPlanQuery,
  ListPlanTaskCategoriesQuery,
} from "@reeka-office/domain-plan"
import { ListPointItemsQuery } from "@reeka-office/domain-point"
import { PlanTaskEditFormDialog } from "./form-dialog"

import { updatePlanTaskAction } from "@/actions/plans/task-actions"
import { getRequiredAdminContext } from "@/lib/admin-context"

function parseId(value: string, label: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`无效${label} ID`)
  }

  return id
}

export default async function PlanTaskEditModalPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const { id: rawId, taskId: rawTaskId } = await params
  const planId = parseId(rawId, "计划")
  const taskId = parseId(rawTaskId, "任务")

  await getRequiredAdminContext()
  const [plan, taskCategories, pointItems] = await Promise.all([
    new GetPlanQuery({ id: planId }).query(),
    new ListPlanTaskCategoriesQuery().query(),
    new ListPointItemsQuery().query(),
  ])

  const stage =
    plan?.stages.find((item) => item.tasks.some((task) => task.id === taskId)) ??
    null
  const task = stage?.tasks.find((item) => item.id === taskId) ?? null

  if (!plan || !stage || !task || plan.status === "archived" || task.status === "archived") {
    return null
  }

  const categoryOptions = taskCategories.map((category) => ({
    value: String(category.id),
    label: category.name,
  }))
  if (!taskCategories.some((category) => category.id === task.categoryId)) {
    categoryOptions.unshift({
      value: String(task.categoryId),
      label: `${task.categoryName}（已停用）`,
    })
  }

  const pointItemOptions = pointItems.map((item) => ({
    value: String(item.id),
    label: `${item.category} / ${item.name}`,
  }))
  if (task.pointItemId && !pointItems.some((item) => item.id === task.pointItemId)) {
    pointItemOptions.unshift({
      value: String(task.pointItemId),
      label: `积分事项 #${task.pointItemId}（不存在）`,
    })
  }

  return (
    <PlanTaskEditFormDialog
      action={updatePlanTaskAction}
      planId={planId}
      planName={plan.name}
      task={{
        id: task.id,
        stageId: stage.id,
        categoryId: task.categoryId,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        isRequired: task.isRequired,
        pointItemId: task.pointItemId,
      }}
      stageOptions={plan.stages.map((item) => ({
        value: String(item.id),
        label: item.title,
      }))}
      categoryOptions={categoryOptions}
      pointItemOptions={pointItemOptions}
    />
  )
}

