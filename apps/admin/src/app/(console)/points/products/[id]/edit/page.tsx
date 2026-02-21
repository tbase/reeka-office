import { ListRedemptionProductsQuery } from "@reeka-office/domain-point"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { ProductForm } from "../../product-form"
import { updateProductAction } from "../../actions"

function parseId(value: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效兑换商品 ID")
  }
  return id
}

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idParam } = await params
  const id = parseId(idParam)

  const products = await new ListRedemptionProductsQuery().query()
  const product = products.find((row) => row.id === id) ?? null

  if (!product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>兑换商品不存在</CardTitle>
          <CardDescription>该商品可能已被删除。</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/points/products">返回兑换商品列表</Link>
        </CardContent>
      </Card>
    )
  }

  if (product.status !== "draft") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>仅草稿商品可编辑</CardTitle>
          <CardDescription>发布后的商品不可修改关键信息，仅允许下架。</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/points/products">返回兑换商品列表</Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">编辑兑换商品：{product.title}</h1>
        <p className="text-muted-foreground text-sm">草稿状态可编辑；发布后仅可下架。</p>
      </div>

      <ProductForm
        action={updateProductAction}
        submitLabel="保存商品"
        cancelHref="/points/products"
        value={product}
      />
    </div>
  )
}
