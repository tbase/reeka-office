import { ProductForm } from "../product-form"
import { createProductAction } from "../actions"

export default function ProductCreatePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增兑换商品</h1>
        <p className="text-muted-foreground text-sm">新建后默认为草稿，可发布后提供给代理人兑换。</p>
      </div>

      <ProductForm action={createProductAction} submitLabel="创建商品" cancelHref="/points/products" />
    </div>
  )
}
