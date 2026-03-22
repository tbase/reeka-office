import { ListPointItemsQuery } from "@reeka-office/domain-point";
import { notFound } from "next/navigation";

import { PointItemFormEdit } from "@/components/points/point-item-form-edit";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";

import { updatePointItemAction } from "@/actions/points/item-actions";

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效积分事项 ID");
  }
  return id;
}

export default async function PointItemEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = parseId(idParam);

  await getRequiredAdminContext();
  const items = await new ListPointItemsQuery().query();
  const item = items.find((row) => row.id === id) ?? null;

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          编辑积分事项：{item.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          修改后会影响后续积分发放规则。
        </p>
      </div>

      <PointItemFormEdit
        action={updatePointItemAction}
        id="point-item-form"
        value={{
          id: item.id,
          name: item.name,
          category: item.category,
          pointAmount: item.pointAmount,
          annualLimit: item.annualLimit,
        }}
      />

      <div className="flex gap-2">
        <Button type="submit" form="point-item-form">
          保存事项
        </Button>
        <LinkButton href="/points/items" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  );
}
