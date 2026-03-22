export const dynamic = "force-dynamic";

import { ListPointItemsQuery } from "@reeka-office/domain-point";
import { PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";

import { deletePointItemAction } from "@/actions/points/item-actions";
import { CategoryTabs } from "./category-tabs";

function parseCategory(value: string | undefined): string | null {
  const category = value?.trim();

  if (!category) {
    return null;
  }

  return category;
}

export default async function PointItemsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const categoryFilter = parseCategory(
    typeof params.category === "string" ? params.category : undefined,
  );
  await getRequiredAdminContext();
  const items = await new ListPointItemsQuery().query();

  const categories = Array.from(
    new Set(items.map((item) => item.category)),
  ).sort((left, right) => left.localeCompare(right, "zh-CN"));
  const activeCategory =
    categoryFilter && categories.includes(categoryFilter)
      ? categoryFilter
      : null;
  const filteredItems = activeCategory
    ? items.filter((item) => item.category === activeCategory)
    : items;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">积分事项</h1>
            <p className="text-muted-foreground text-sm">
              用于定义可发放积分的事项及默认规则。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">共 {filteredItems.length} 条</Badge>
            <LinkButton href="/points/items/new" size="sm">
              <PlusIcon className="size-4" />
              新增事项
            </LinkButton>
          </div>
        </div>

        <CategoryTabs categories={categories} />
      </div>

      {filteredItems.length === 0 ? (
        <Empty
          title={activeCategory ? "该类别下暂无积分事项。" : "暂无积分事项。"}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="shrink-0">
                    {item.category}
                  </Badge>
                  <CardTitle className="min-w-0 text-base">
                    {item.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                  <p>积分金额</p>
                  <p className="text-foreground text-right">
                    {item.pointAmount ?? "未配置"}
                  </p>
                  <p>年次数上限</p>
                  <p className="text-foreground text-right">
                    {item.annualLimit ?? "不限"}
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <LinkButton
                    href={`/points/items/${item.id}/edit`}
                    variant="outline"
                    size="sm"
                  >
                    编辑
                  </LinkButton>
                  <ConfirmAction
                    action={deletePointItemAction}
                    hiddenFields={{ id: String(item.id) }}
                    title={`删除「${item.name}」？`}
                    description="此操作不可撤销。删除后该事项将无法用于积分发放。"
                    confirmLabel="确认删除"
                  >
                    <Button variant="destructive" size="sm">
                      删除
                    </Button>
                  </ConfirmAction>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
