import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { ProductFormNew } from "@/components/points/product-form-new"

import { createProductAction } from "../actions"

export default function ProductCreatePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增兑换商品</h1>
        <p className="text-muted-foreground text-sm">
          新建后默认为草稿，可发布后提供给代理人兑换。
        </p>
      </div>

      <ProductFormNew action={createProductAction} id="product-form" />

      <div className="flex gap-2">
        <Button type="submit" form="product-form">
          创建商品
        </Button>
        <LinkButton href="/points/products" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
