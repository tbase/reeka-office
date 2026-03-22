export const dynamic = "force-dynamic"

import { ListPlanTaskCategoriesQuery } from "@reeka-office/domain-plan"

import { updatePlanTaskCategoryAction } from "@/actions/plans/task-category-actions"
import { PlanTaskCategoryForm } from "@/components/plans/plan-task-category-form"
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

function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效任务分类 ID")
  }

  return id
}

export default async function PlanTaskCategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const categoryId = parseId(rawId)

  await getRequiredAdminContext()
  const categories = await new ListPlanTaskCategoriesQuery({ includeInactive: true }).query()
  const category = categories.find((item) => item.id === categoryId) ?? null

  if (!category) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务分类不存在</CardTitle>
          <CardDescription>该任务分类可能已被删除。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href="/plans/task-categories" variant="outline" size="sm">
            返回分类列表
          </LinkButton>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">编辑任务分类</h1>
        <p className="text-muted-foreground text-sm">修改任务分类名称。</p>
      </div>

      <PlanTaskCategoryForm
        action={updatePlanTaskCategoryAction}
        id="plan-task-category-form"
        value={{
          id: category.id,
          name: category.name,
        }}
      />

      <div className="flex justify-end gap-2">
        <Button type="submit" form="plan-task-category-form">
          保存分类
        </Button>
        <LinkButton href="/plans/task-categories" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
