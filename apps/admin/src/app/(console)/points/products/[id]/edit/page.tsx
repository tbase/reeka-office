import { ListRedemptionProductsQuery } from "@reeka-office/domain-point";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductFormEdit } from "@/components/points/product-form-edit";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";

import { updateProductAction } from "../../actions";

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效兑换商品 ID");
  }
  return id;
}

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = parseId(idParam);

  const ctx = await getRequiredAdminContext();
  const products = await new ListRedemptionProductsQuery(ctx).query();
  const product = products.find((row) => row.id === id) ?? null;

  if (!product) {
    notFound();
  }

  if (product.status !== "draft") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>仅草稿商品可编辑</CardTitle>
          <CardDescription>
            发布后的商品不可修改关键信息，仅允许下架。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/points/products">返回兑换商品列表</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          编辑兑换商品：{product.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          草稿状态可编辑；发布后仅可下架。
        </p>
      </div>

      <ProductFormEdit
        action={updateProductAction}
        id="product-form"
        value={{
          id: product.id,
          redeemCategory: product.redeemCategory,
          title: product.title,
          imageUrl: product.imageUrl,
          description: product.description,
          notice: product.notice,
          validPeriodMonths: product.validPeriodMonths,
          stock: product.stock,
          redeemPoints: product.redeemPoints,
          maxRedeemPerAgent: product.maxRedeemPerAgent,
        }}
      />

      <div className="flex gap-2">
        <Button type="submit" form="product-form">
          保存商品
        </Button>
        <LinkButton href="/points/products" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  );
}
