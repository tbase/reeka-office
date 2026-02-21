import { PointItemForm } from "../point-item-form"
import { createPointItemAction } from "../actions"

export default function PointItemCreatePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增积分事项</h1>
        <p className="text-muted-foreground text-sm">创建后可用于代理人积分发放。</p>
      </div>

      <PointItemForm action={createPointItemAction} submitLabel="创建事项" cancelHref="/points/items" />
    </div>
  )
}
