import { ListRedemptionProductsQuery } from "@reeka-office/domain-point";
import { notFound } from "next/navigation";

import { getRequiredAdminContext } from "@/lib/admin-context";

import { ProductEditFormDialog } from "./form-dialog";

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效兑换商品 ID");
  }
  return id;
}

export default async function ProductEditModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = parseId(idParam);

  await getRequiredAdminContext();
  const products = await new ListRedemptionProductsQuery().query();
  const product = products.find((row) => row.id === id) ?? null;

  if (!product || product.status !== "draft") {
    notFound();
  }

  return (
    <ProductEditFormDialog
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
  );
}
