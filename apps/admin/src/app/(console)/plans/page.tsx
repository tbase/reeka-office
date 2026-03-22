export const dynamic = "force-dynamic";

import { GetPlanQuery, ListPlansQuery } from "@reeka-office/domain-plan";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

import {
  getPlanStatusText,
  getPlanStatusVariant,
} from "@/components/plans/status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";
import { formatDateTime } from "@/lib/datetime";

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function getTaskCount(
  plan: NonNullable<Awaited<ReturnType<GetPlanQuery["query"]>>>,
) {
  return plan.stages.reduce((count, stage) => count + stage.tasks.length, 0);
}

export default async function PlansPage() {
  await getRequiredAdminContext();
  const basePlans = await new ListPlansQuery().query();
  const plans = (
    await Promise.all(
      basePlans.map((plan) => new GetPlanQuery({ id: plan.id }).query()),
    )
  )
    .filter(isPresent)
    .slice()
    .sort(
      (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
    );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">计划列表</h1>
            <p className="text-muted-foreground text-sm">
              维护计划基础信息、阶段和任务结构。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">共 {plans.length} 条</Badge>
            <LinkButton href="/plans/new" size="sm">
              <PlusIcon className="size-4" />
              新增计划
            </LinkButton>
          </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <Empty
          title="暂无计划。"
          description="先创建一个计划，再配置阶段和任务。"
          action={
            <LinkButton href="/plans/new" size="sm">
              <PlusIcon className="size-4" />
              新增计划
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const taskCount = getTaskCount(plan);
            const detailHref = `/plans/${plan.id}`;

            return (
              <Link key={plan.id} href={detailHref} className="block">
                <Card className="h-full transition-colors hover:border-foreground/30">
                  <CardHeader className="gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="truncate">{plan.name}</CardTitle>
                        <p className="text-muted-foreground text-xs">
                          更新于 {formatDateTime(plan.updatedAt)}
                        </p>
                      </div>
                      <Badge variant={getPlanStatusVariant(plan.status)}>
                        {getPlanStatusText(plan.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {plan.description || "-"}
                    </p>

                    <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                      <p>阶段数</p>
                      <p className="text-foreground text-right">
                        {plan.stages.length}
                      </p>
                      <p>任务数</p>
                      <p className="text-foreground text-right">{taskCount}</p>
                      <p>创建时间</p>
                      <p className="text-foreground text-right">
                        {formatDateTime(plan.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
