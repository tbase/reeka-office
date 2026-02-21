export const dynamic = "force-dynamic"

import { ListPointItemsQuery } from "@reeka-office/domain-point"
import { PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { LinkButton } from "@/components/ui/link-button"

import { deletePointItemAction } from "./actions"

export default async function PointItemsPage() {
  const items = await new ListPointItemsQuery().query()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">积分事项</h1>
          <p className="text-muted-foreground text-sm">用于定义可发放积分的事项及默认规则。</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">共 {items.length} 条</Badge>
          <LinkButton href="/points/items/new" size="sm">
            <PlusIcon className="size-4" />
            新增事项
          </LinkButton>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm">
          暂无积分事项。
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-base leading-none">{item.name}</CardTitle>
                  <p className="text-muted-foreground text-xs">类别：{item.category}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <p>积分金额：{item.pointAmount ?? "未配置"}</p>
                  <p>年次数上限：{item.annualLimit ?? "不限"}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <LinkButton href={`/points/items/${item.id}/edit`} variant="outline" size="sm">
                    编辑
                  </LinkButton>
                  <ConfirmAction
                    action={deletePointItemAction}
                    hiddenFields={{ id: String(item.id) }}
                    title={`删除「${item.name}」？`}
                    description="此操作不可撤销。删除后该事项将无法用于积分发放。"
                    confirmLabel="确认删除"
                  >
                    <Button variant="destructive" size="sm">删除</Button>
                  </ConfirmAction>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
