export const dynamic = "force-dynamic"

import { GetPlanQuery } from "@reeka-office/domain-plan"
import { ArrowLeftIcon } from "lucide-react"

import {
  archivePlanAction,
  publishPlanAction,
  updatePlanAction,
} from "@/actions/plans/plan-actions"
import { PlanForm } from "@/components/plans/plan-form"
import {
  getPlanStatusText,
  getPlanStatusVariant,
} from "@/components/plans/status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { LinkButton } from "@/components/ui/link-button"
import { getRequiredAdminContext } from "@/lib/admin-context"
import { formatDateTime } from "@/lib/datetime"

function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效计划 ID")
  }

  return id
}

export default async function PlanEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const planId = parseId(rawId)

  await getRequiredAdminContext()
  const plan = await new GetPlanQuery({ id: planId }).query()

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>计划不存在</CardTitle>
          <CardDescription>该计划可能已被删除。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href="/plans" variant="outline" size="sm">
            返回计划列表
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  const canEdit = plan.status !== "archived"
  const planDetailHref = `/plans/${plan.id}`
  const taskCount = plan.stages.reduce((count, stage) => count + stage.tasks.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <LinkButton href={planDetailHref} variant="ghost" size="sm" className="-ml-2">
            <ArrowLeftIcon className="size-4" />
            返回详情
          </LinkButton>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{plan.name}</h1>
            <Badge variant={getPlanStatusVariant(plan.status)}>
              {getPlanStatusText(plan.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            更新于 {formatDateTime(plan.updatedAt)}，共 {plan.stages.length} 个阶段 / {taskCount} 个任务。
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>编辑计划信息</CardTitle>
          <CardDescription>
            {canEdit
              ? "修改计划名称、说明，并执行发布或归档操作。"
              : "该计划已归档，仅保留查看，不再允许继续修改。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlanForm
            action={updatePlanAction}
            id="plan-form"
            value={{
              id: plan.id,
              name: plan.name,
              description: plan.description,
            }}
            disabled={!canEdit}
          />

          <div className="flex flex-wrap justify-end gap-2">
            {canEdit ? (
              <Button type="submit" form="plan-form">
                保存计划
              </Button>
            ) : null}

            {plan.status === "draft" ? (
              <ConfirmAction
                action={publishPlanAction}
                hiddenFields={{ id: plan.id }}
                title={`发布「${plan.name}」？`}
                description="发布后计划将进入可执行状态。"
                confirmLabel="确认发布"
                confirmVariant="default"
              >
                <Button size="sm">发布计划</Button>
              </ConfirmAction>
            ) : null}

            {plan.status === "published" ? (
              <ConfirmAction
                action={archivePlanAction}
                hiddenFields={{ id: plan.id }}
                title={`归档「${plan.name}」？`}
                description="归档后计划仍可查看，但不再允许编辑。"
                confirmLabel="确认归档"
                confirmVariant="secondary"
              >
                <Button variant="secondary" size="sm">
                  归档计划
                </Button>
              </ConfirmAction>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
