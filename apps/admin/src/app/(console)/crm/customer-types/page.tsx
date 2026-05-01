export const dynamic = "force-dynamic";

import { ListCustomerTypeSummariesQuery } from "@reeka-office/domain-crm";
import { PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";

export default async function CrmCustomerTypesPage() {
  await getRequiredAdminContext();
  const items = await new ListCustomerTypeSummariesQuery().query();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">客户类型</h1>
          <p className="text-muted-foreground text-sm">
            维护小程序端可用的客户类型和画像字段。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">共 {items.length} 类</Badge>
          <LinkButton href="/crm/customer-types/new" size="sm">
            <PlusIcon className="size-4" />
            新增类型
          </LinkButton>
        </div>
      </div>

      {items.length === 0 ? (
        <Empty title="暂无客户类型。" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={item.enabled ? "secondary" : "outline"}>
                    {item.enabled ? "启用" : "停用"}
                  </Badge>
                  {item.supportsOpportunity ? (
                    <Badge variant="outline">销售机会</Badge>
                  ) : null}
                </div>
                <CardTitle className="text-base">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                  <span>排序</span>
                  <span className="text-foreground text-right">{item.sortOrder}</span>
                </div>
                <div className="flex justify-end">
                  <LinkButton href={`/crm/customer-types/${item.id}/edit`} variant="outline" size="sm">
                    编辑
                  </LinkButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
