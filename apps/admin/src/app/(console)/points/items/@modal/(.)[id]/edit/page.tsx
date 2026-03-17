import { ListPointItemsQuery } from "@reeka-office/domain-point";
import { notFound } from "next/navigation";

import { getRequiredAdminContext } from "@/lib/admin-context";

import { PointItemEditFormDialog } from "./form-dialog";

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效积分事项 ID");
  }
  return id;
}

export default async function PointItemEditModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = parseId(idParam);

  const ctx = await getRequiredAdminContext();
  const items = await new ListPointItemsQuery(ctx).query();
  const item = items.find((row) => row.id === id) ?? null;

  if (!item) {
    notFound();
  }

  return (
    <PointItemEditFormDialog
      value={{
        id: item.id,
        name: item.name,
        category: item.category,
        pointAmount: item.pointAmount,
        annualLimit: item.annualLimit,
      }}
    />
  );
}
