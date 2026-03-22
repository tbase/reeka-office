export const dynamic = "force-dynamic"

import { ListPlanTaskCategoriesQuery } from "@reeka-office/domain-plan"
import { PlusIcon } from "lucide-react"

import { disablePlanTaskCategoryAction } from "@/actions/plans/task-category-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { Empty } from "@/components/ui/empty"
import { LinkButton } from "@/components/ui/link-button"
import { getRequiredAdminContext } from "@/lib/admin-context"

export default async function PlanTaskCategoriesPage() {
  await getRequiredAdminContext()
  const categories = await new ListPlanTaskCategoriesQuery({ includeInactive: true }).query()

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">任务分类</h1>
            <p className="text-muted-foreground text-sm">管理计划任务使用的分类。</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">共 {categories.length} 条</Badge>
            <LinkButton href="/plans/task-categories/new" size="sm">
              <PlusIcon className="size-4" />
              新增分类
            </LinkButton>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <Empty
          title="暂无任务分类。"
          description="创建任务前，先维护至少一个分类。"
          action={
            <LinkButton href="/plans/task-categories/new" size="sm">
              <PlusIcon className="size-4" />
              新增分类
            </LinkButton>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <div className="divide-y">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">{category.name}</span>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "启用中" : "已停用"}
                  </Badge>
                </div>

                <div className="flex justify-end gap-2">
                  <LinkButton
                    href={`/plans/task-categories/${category.id}/edit`}
                    variant="outline"
                    size="sm"
                  >
                    编辑
                  </LinkButton>

                  <ConfirmAction
                    action={disablePlanTaskCategoryAction}
                    hiddenFields={{ id: category.id }}
                    title={`停用或删除「${category.name}」？`}
                    description="被任务引用时会停用；未被引用时会直接删除。"
                    confirmLabel="确认执行"
                    confirmVariant="secondary"
                  >
                    <Button variant="secondary" size="sm">
                      停用/删除
                    </Button>
                  </ConfirmAction>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
