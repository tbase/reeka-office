import { createPlanTaskCategoryAction } from "@/actions/plans/task-category-actions"
import { PlanTaskCategoryForm } from "@/components/plans/plan-task-category-form"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"

export default function PlanTaskCategoryCreatePage() {
  return (
    <div className="max-w-xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增任务分类</h1>
        <p className="text-muted-foreground text-sm">每行一个分类名称，提交后批量创建。</p>
      </div>

      <PlanTaskCategoryForm
        action={createPlanTaskCategoryAction}
        id="plan-task-category-form"
        redirectTo="/plans/task-categories"
      />

      <div className="flex justify-end gap-2">
        <Button type="submit" form="plan-task-category-form">
          批量创建分类
        </Button>
        <LinkButton href="/plans/task-categories" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
