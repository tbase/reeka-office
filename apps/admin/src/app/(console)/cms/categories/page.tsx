export const dynamic = 'force-dynamic';

import { ListCategoriesQuery } from "@reeka-office/domain-cms"
import { PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { LinkButton } from "@/components/ui/link-button"

import { deleteCategoryAction } from "./actions"

export default async function CmsCategoriesPage() {
  const categories = await new ListCategoriesQuery().query()

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">分类列表</h1>
            <p className="text-muted-foreground text-sm">可新建分类或进入详情编辑。</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">共 {categories.length} 条</Badge>
            <LinkButton href="/cms/categories/new" size="sm">
              <PlusIcon className="size-4" />
              新增分类
            </LinkButton>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm">
          暂无分类。
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            return (
              <Card key={category.id}>
                <CardHeader className="gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-none">{category.name}</CardTitle>
                    <p className="text-muted-foreground text-xs">{category.slug}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm line-clamp-2">{category.description || "-"}</p>
                  <div className="flex justify-end gap-2">
                    <LinkButton href={`/cms/categories/${category.id}/edit`} variant="outline" size="sm">编辑</LinkButton>
                    <ConfirmAction
                      action={deleteCategoryAction}
                      hiddenFields={{ id: category.id }}
                      title={`删除「${category.name}」？`}
                      description="此操作不可撤销，分类将被永久删除。"
                      confirmLabel="确认删除"
                    >
                      <Button size="sm" variant="destructive">删除</Button>
                    </ConfirmAction>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
