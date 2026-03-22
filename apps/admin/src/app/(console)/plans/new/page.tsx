import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"

import { createPlanAction } from "@/actions/plans/plan-actions"
import { PlanForm } from "@/components/plans/plan-form"

export default function PlanCreatePage() {
  return (
    <div className="max-w-xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增计划</h1>
        <p className="text-muted-foreground text-sm">
          先创建计划基础信息，后续再配置阶段和任务。
        </p>
      </div>

      <PlanForm
        action={createPlanAction}
        id="plan-form"
        redirectTo="/plans"
      />

      <div className="flex justify-end gap-2">
        <Button type="submit" form="plan-form">
          创建计划
        </Button>
        <LinkButton href="/plans" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
