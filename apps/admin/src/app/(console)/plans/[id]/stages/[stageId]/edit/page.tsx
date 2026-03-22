export const dynamic = "force-dynamic"

import { GetPlanQuery } from "@reeka-office/domain-plan"

import { updatePlanStageAction } from "@/actions/plans/stage-actions"
import { PlanStageForm } from "@/components/plans/plan-stage-form"
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

export default async function PlanStageEditPage({
  params,
}: {
  params: Promise<{ id: string; stageId: string }>
}) {
  const { id: rawId, stageId: rawStageId } = await params
  const planId = parseId(rawId, "计划")
  const stageId = parseId(rawStageId, "阶段")
  const planDetailHref = `/plans/${planId}`

  await getRequiredAdminContext()
  const plan = await new GetPlanQuery({ id: planId }).query()

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>计划不存在</CardTitle>
          <CardDescription>无法编辑该阶段。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href="/plans" variant="outline" size="sm">
            返回计划列表
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  const stage = plan.stages.find((item) => item.id === stageId) ?? null
  if (!stage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>阶段不存在</CardTitle>
          <CardDescription>该阶段可能已被删除。</CardDescription>
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
          <CardDescription>归档计划不可继续编辑阶段。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href={planDetailHref} variant="outline" size="sm">
            返回计划详情
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">编辑阶段</h1>
        <p className="text-muted-foreground text-sm">
          当前计划：{plan.name}
        </p>
      </div>

      <PlanStageForm
        action={updatePlanStageAction}
        id="plan-stage-form"
        redirectTo={planDetailHref}
        value={{
          id: stage.id,
          planId,
          title: stage.title,
          description: stage.description,
        }}
      />

      <div className="flex justify-end gap-2">
        <Button type="submit" form="plan-stage-form">
          保存阶段
        </Button>
        <LinkButton href={planDetailHref} variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
