export const dynamic = "force-dynamic"

import {
  GetPlanQuery,
  ListPlanTaskCategoriesQuery,
} from "@reeka-office/domain-plan"
import { ListPointItemsQuery } from "@reeka-office/domain-point"

import { createPlanTaskAction } from "@/actions/plans/task-actions"
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

export default async function PlanTaskCreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id: rawId } = await params
  const planId = parseId(rawId, "计划")
  const planDetailHref = `/plans/${planId}`
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

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>计划不存在</CardTitle>
          <CardDescription>无法为不存在的计划新增任务。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href="/plans" variant="outline" size="sm">
            返回计划列表
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
          <CardDescription>归档计划不可继续新增任务。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href={planDetailHref} variant="outline" size="sm">
            返回计划详情
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  if (plan.stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>暂无可用阶段</CardTitle>
          <CardDescription>请先为计划创建阶段，再新增任务。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <LinkButton href={planDetailHref} variant="outline" size="sm">
            返回计划详情
          </LinkButton>
          <LinkButton href={`/plans/${planId}/stages/new`} size="sm">
            新增阶段
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  if (taskCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>暂无可用任务分类</CardTitle>
          <CardDescription>请先创建任务分类，再新增任务。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <LinkButton href={planDetailHref} variant="outline" size="sm">
            返回计划详情
          </LinkButton>
          <LinkButton href="/plans/task-categories/new" size="sm">
            新增任务分类
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  const defaultStageId =
    requestedStageId && plan.stages.some((stage) => stage.id === requestedStageId)
      ? requestedStageId
      : plan.stages[0]?.id

  return (
    <div className="max-w-xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增任务</h1>
        <p className="text-muted-foreground text-sm">
          当前计划：{plan.name}
        </p>
      </div>

      <PlanTaskForm
        action={createPlanTaskAction}
        id="plan-task-form"
        redirectTo={planDetailHref}
        value={{
          planId,
          stageId: defaultStageId ?? undefined,
          taskType: "normal",
          isRequired: false,
          pointItemId: undefined,
        }}
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

      <div className="flex justify-end gap-2">
        <Button type="submit" form="plan-task-form">
          创建任务
        </Button>
        <LinkButton href={planDetailHref} variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
