import { ListRedemptionProductsQuery } from "@reeka-office/domain-point"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { LinkButton } from "@/components/ui/link-button"

import {
  deleteProductAction,
  offShelfProductAction,
  publishProductAction,
} from "./actions"

type ProductStatus = "draft" | "published" | "off_shelf"

function getStatusText(status: ProductStatus): string {
  if (status === "draft") return "草稿"
  if (status === "published") return "已发布"
  return "已下架"
}

function getStatusVariant(status: ProductStatus): "default" | "secondary" | "outline" {
  if (status === "published") return "default" as const
  if (status === "off_shelf") return "secondary" as const
  return "outline" as const
}

function formatValidPeriod(months: number | null): string {
  if (months === null) {
    return "不限"
  }

  return `${months}个月`
}

type ProductListProps = {
  status?: ProductStatus
}

export async function ProductList({ status }: ProductListProps) {
  const products = await new ListRedemptionProductsQuery({ status }).query()

  if (products.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm">
        暂无兑换商品。
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base leading-none">{product.title}</CardTitle>
              <Badge variant={getStatusVariant(product.status)}>{getStatusText(product.status)}</Badge>
            </div>
            <p className="text-muted-foreground text-xs">类别：{product.redeemCategory}</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <p>积分：{product.redeemPoints}</p>
              <p>库存：{product.stock}</p>
              <p>每人上限：{product.maxRedeemPerAgent}</p>
              <p>有效期：{formatValidPeriod(product.validPeriodMonths)}</p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {product.status === "draft" ? (
                <>
                  <LinkButton href={`/points/products/${product.id}/edit`} variant="outline" size="sm">
                    编辑
                  </LinkButton>
                  <ConfirmAction
                    action={publishProductAction}
                    hiddenFields={{ id: product.id }}
                    title={`发布「${product.title}」？`}
                    description="发布后关键信息不可再修改，仅允许下架。"
                    confirmLabel="确认发布"
                    confirmVariant="default"
                  >
                    <Button size="sm">发布</Button>
                  </ConfirmAction>
                  <ConfirmAction
                    action={deleteProductAction}
                    hiddenFields={{ id: product.id }}
                    title={`删除「${product.title}」？`}
                    description="此操作不可撤销，草稿商品将被永久删除。"
                    confirmLabel="确认删除"
                  >
                    <Button variant="destructive" size="sm">删除</Button>
                  </ConfirmAction>
                </>
              ) : null}

              {product.status === "published" ? (
                <ConfirmAction
                  action={offShelfProductAction}
                  hiddenFields={{ id: product.id }}
                  title={`下架「${product.title}」？`}
                  description="下架后代理人将无法兑换此商品。"
                  confirmLabel="确认下架"
                  confirmVariant="secondary"
                >
                  <Button variant="secondary" size="sm">下架</Button>
                </ConfirmAction>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
