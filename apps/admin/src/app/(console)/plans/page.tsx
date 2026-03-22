export const dynamic = "force-dynamic";

import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";

import { PlanList } from "./plan-list";
import { PlanStatusTabs } from "./plan-status-tabs";
import { parsePlanStatus } from "./search-params";

export default async function PlansPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const status = parsePlanStatus(
    typeof params.status === "string" ? params.status : undefined,
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">计划列表</h1>
            <p className="text-muted-foreground text-sm">
              按状态查看和维护计划基础信息、阶段与任务结构。
            </p>
          </div>
          <LinkButton href="/plans/new" size="sm">
            <PlusIcon className="size-4" />
            新增计划
          </LinkButton>
        </div>

        <PlanStatusTabs />
      </div>

      <Suspense key={status} fallback={<Empty title="正在加载计划..." />}>
        <PlanList status={status} />
      </Suspense>
    </div>
  );
}
