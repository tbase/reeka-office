export const dynamic = "force-dynamic"

import {
  GetPlanQuery,
  ListPlanTaskCategoriesQuery,
} from "@reeka-office/domain-plan"
import { ListPointItemsQuery } from "@reeka-office/domain-point"

import { updatePlanTaskAction } from "@/actions/plans/task-actions"
import { PlanTaskForm } from "@/components/plans/plan-task-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"
import { getRequiredAdminContext } from "@/lib/admin-context"

function parseId(value: string, label: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`无效${label} ID`)
  }

  return id
}

export default async function PlanTaskEditPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const { id: rawId, taskId: rawTaskId } = await params
  const planId = parseId(rawId, "计划")
  const taskId = parseId(rawTaskId, "任务")
  const planDetailHref = `/plans/${planId}`

  await getRequiredAdminContext()
  const [plan, taskCategories, pointItems] = await Promise.all([
    new GetPlanQuery({ id: planId }).query(),
    new ListPlanTaskCategoriesQuery().query(),
    new ListPointItemsQuery().query(),
  ])

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>计划不存在</CardTitle>
          <CardDescription>无法编辑该任务。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href="/plans" variant="outline" size="sm">
            返回计划列表
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  const stage =
    plan.stages.find((item) => item.tasks.some((task) => task.id === taskId)) ??
    null
  const task = stage?.tasks.find((item) => item.id === taskId) ?? null

  if (!stage || !task) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务不存在</CardTitle>
          <CardDescription>该任务可能已被删除。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href={planDetailHref} variant="outline" size="sm">
            返回计划详情
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  if (plan.status === "archived") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>计划已归档</CardTitle>
          <CardDescription>归档计划不可继续编辑任务。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href={planDetailHref} variant="outline" size="sm">
            返回计划详情
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  if (task.status === "archived") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务已归档</CardTitle>
          <CardDescription>归档任务不可继续编辑。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href={planDetailHref} variant="outline" size="sm">
            返回计划详情
          </LinkButton>
        </CardContent>
      </Card>
    )
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
    <div className="max-w-xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">编辑任务</h1>
        <p className="text-muted-foreground text-sm">
          当前计划：{plan.name}
        </p>
      </div>

      <PlanTaskForm
        action={updatePlanTaskAction}
        id="plan-task-form"
        redirectTo={planDetailHref}
        value={{
          id: task.id,
          planId,
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

      <div className="flex justify-end gap-2">
        <Button type="submit" form="plan-task-form">
          保存任务
        </Button>
        <LinkButton href={planDetailHref} variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
