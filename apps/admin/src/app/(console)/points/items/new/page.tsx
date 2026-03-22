import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { PointItemFormNew } from "@/components/points/point-item-form-new"

import { createPointItemAction } from "@/actions/points/item-actions"

export default function PointItemCreatePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增积分事项</h1>
        <p className="text-muted-foreground text-sm">创建后可用于代理人积分发放。</p>
      </div>

      <PointItemFormNew action={createPointItemAction} id="point-item-form" />

      <div className="flex gap-2">
        <Button type="submit" form="point-item-form">
          创建事项
        </Button>
        <LinkButton href="/points/items" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
