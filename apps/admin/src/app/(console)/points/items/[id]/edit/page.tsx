import { ListPointItemsQuery } from "@reeka-office/domain-point"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { PointItemForm } from "../../point-item-form"
import { updatePointItemAction } from "../../actions"

function parseId(value: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效积分事项 ID")
  }
  return id
}

export default async function PointItemEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idParam } = await params
  const id = parseId(idParam)

  const items = await new ListPointItemsQuery().query()
  const item = items.find((row) => row.id === id) ?? null

  if (!item) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>积分事项不存在</CardTitle>
          <CardDescription>该事项可能已被删除。</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/points/items">返回积分事项列表</Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">编辑积分事项：{item.name}</h1>
        <p className="text-muted-foreground text-sm">修改后会影响后续积分发放规则。</p>
      </div>

      <PointItemForm
        action={updatePointItemAction}
        submitLabel="保存事项"
        cancelHref="/points/items"
        value={item}
      />
    </div>
  )
}
