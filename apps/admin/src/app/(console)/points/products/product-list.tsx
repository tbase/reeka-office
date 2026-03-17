import { ListRedemptionProductsQuery } from "@reeka-office/domain-point";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";

import {
  deleteProductAction,
  offShelfProductAction,
  publishProductAction,
} from "./actions";

type ProductStatus = "draft" | "published" | "off_shelf";

function getStatusText(status: ProductStatus): string {
  if (status === "draft") return "草稿";
  if (status === "published") return "已发布";
  return "已下架";
}

function getStatusVariant(
  status: ProductStatus,
): "default" | "secondary" | "outline" {
  if (status === "published") return "default" as const;
  if (status === "off_shelf") return "secondary" as const;
  return "outline" as const;
}

function formatValidPeriod(months: number | null): string {
  if (months === null) {
    return "不限";
  }

  return `${months}个月`;
}

type ProductListProps = {
  status?: ProductStatus;
};

export async function ProductList({ status }: ProductListProps) {
  await getRequiredAdminContext();
  const products = await new ListRedemptionProductsQuery({
    status,
  }).query();

  if (products.length === 0) {
    return <Empty title="暂无兑换商品。" />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <CardTitle className="truncate text-base leading-none">
                  {product.title}
                </CardTitle>
                <Badge variant="outline">{product.redeemCategory}</Badge>
              </div>
              <Badge variant={getStatusVariant(product.status)}>
                {getStatusText(product.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="bg-muted/40 relative aspect-square w-24 shrink-0 overflow-hidden rounded-md border">
                {product.imageUrl ? (
                  <Image
                    src={`/${product.imageUrl}`}
                    alt={product.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                    暂无图片
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <p>积分：{product.redeemPoints}</p>
                <p>库存：{product.stock}</p>
                <p>每人上限：{product.maxRedeemPerAgent}</p>
                <p>有效期：{formatValidPeriod(product.validPeriodMonths)}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {product.status === "draft" ? (
                <>
                  <LinkButton
                    href={`/points/products/${product.id}/edit`}
                    variant="outline"
                    size="sm"
                  >
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
                    <Button variant="destructive" size="sm">
                      删除
                    </Button>
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
                  <Button variant="secondary" size="sm">
                    下架
                  </Button>
                </ConfirmAction>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
