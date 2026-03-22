import { ListPlansQuery } from "@reeka-office/domain-plan";
import Link from "next/link";

import { publishPlanAction } from "@/actions/plans/plan-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Empty } from "@/components/ui/empty";
import { formatDateTime } from "@/lib/datetime";

import type { PlanStatusFilter } from "./search-params";

type PlanListProps = {
  status: PlanStatusFilter;
};

function getEmptyTitle(status: PlanStatusFilter) {
  if (status === "draft") {
    return "暂无草稿计划。";
  }

  if (status === "archived") {
    return "暂无归档计划。";
  }

  return "暂无已发布计划。";
}

export async function PlanList({ status }: PlanListProps) {
  const plans = await new ListPlansQuery({
    statuses: [status],
  }).query();

  if (plans.length === 0) {
    return (
      <Empty
        title={getEmptyTitle(status)}
        description="先创建一个计划，再配置阶段和任务。"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline">共 {plans.length} 条</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const detailHref = `/plans/${plan.id}`;

          return (
            <Card
              key={plan.id}
              className="h-full transition-colors hover:border-foreground/30"
            >
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="min-w-0 flex-1 truncate">
                        <Link href={detailHref} className="hover:underline">
                          {plan.name}
                        </Link>
                      </CardTitle>
                      {plan.status === "draft" ? (
                        <ConfirmAction
                          action={publishPlanAction}
                          hiddenFields={{ id: plan.id }}
                          title={`发布「${plan.name}」？`}
                          description="发布后计划将进入可执行状态。"
                          confirmLabel="确认发布"
                          confirmVariant="default"
                        >
                          <Button size="sm">发布</Button>
                        </ConfirmAction>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {plan.description || "-"}
                </p>

                <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                  <p>创建时间</p>
                  <p className="text-foreground text-right">
                    {formatDateTime(plan.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
